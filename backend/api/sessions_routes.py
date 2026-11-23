"""
Sessions Blueprint — Endpoints for user-specific monitoring sessions, telemetry, and PDF reports.
"""
import io
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from flask import Blueprint, jsonify, request, g, send_file

from backend.db.mongo import sessions_col, telemetry_col, get_fs
from backend.auth.routes import require_auth

sessions_bp = Blueprint("sessions", __name__)


def _posture_score_from_telemetry(records):
    """Calculate the same SAFE/WARNING/ NON-SAFE weighted score as PDF reports."""
    safe_count = 0
    warning_count = 0
    total_count = 0

    for record in records:
        status_counts = record.get("status_counts") or {}
        if status_counts:
            record_total = sum(
                int(count) for count in status_counts.values()
                if isinstance(count, (int, float))
            )
        else:
            record_total = int(record.get("sample_count", 1) or 1)
            status = str(record.get("final_status", "UNKNOWN")).upper()
            status_counts = {status: record_total}

        total_count += record_total
        safe_count += int(status_counts.get("SAFE", 0))
        warning_count += int(status_counts.get("WARNING", 0))

    if total_count <= 0:
        return None
    return round(((safe_count + (0.5 * warning_count)) / total_count) * 100.0, 1)


# ---------------------------------------------------------------------------
# GET /api/sessions — List all sessions for the logged-in user
# ---------------------------------------------------------------------------
@sessions_bp.route("", methods=["GET"])
@require_auth
def list_sessions():
    """Returns recent sessions for logged-in user with pagination."""
    limit = min(int(request.args.get("limit", 20)), 100)
    page = max(int(request.args.get("page", 1)), 1)
    skip = (page - 1) * limit

    col = sessions_col()
    query = {"user_id": g.user_id}

    total = col.count_documents(query)
    cursor = col.find(query).sort("started_at", -1).skip(skip).limit(limit)

    sessions = []
    for s in cursor:
        sessions.append({
            "id": str(s["_id"]),
            "started_at": s.get("started_at").isoformat() if s.get("started_at") else None,
            "ended_at": s.get("ended_at").isoformat() if s.get("ended_at") else None,
            "duration_sec": s.get("duration_sec", 0),
            "frame_count": s.get("frame_count", 0),
            "status": s.get("status", "unknown"),
            "has_pdf": bool(s.get("pdf_gridfs_id")),
            "final_stats": s.get("final_stats", {}),
        })

    return jsonify({
        "sessions": sessions,
        "total": total,
        "page": page,
        "limit": limit
    }), 200


# ---------------------------------------------------------------------------
# GET /api/sessions/<session_id> — Single session details
# ---------------------------------------------------------------------------
@sessions_bp.route("/<session_id>", methods=["GET"])
@require_auth
def get_session(session_id):
    """Retrieve full details for a single session."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        return jsonify({"error": "Invalid session ID format"}), 400

    col = sessions_col()
    session = col.find_one({"_id": oid, "user_id": g.user_id})
    if not session:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({
        "id": str(session["_id"]),
        "started_at": session.get("started_at").isoformat() if session.get("started_at") else None,
        "ended_at": session.get("ended_at").isoformat() if session.get("ended_at") else None,
        "duration_sec": session.get("duration_sec", 0),
        "frame_count": session.get("frame_count", 0),
        "status": session.get("status", "unknown"),
        "has_pdf": bool(session.get("pdf_gridfs_id")),
        "final_stats": session.get("final_stats", {}),
    }), 200


# ---------------------------------------------------------------------------
# GET /api/sessions/<session_id>/telemetry — Downsampled telemetry points
# ---------------------------------------------------------------------------
@sessions_bp.route("/<session_id>/telemetry", methods=["GET"])
@require_auth
def get_session_telemetry(session_id):
    """Fetch downsampled telemetry timeline points for charts."""
    max_points = min(int(request.args.get("points", 200)), 500)

    t_col = telemetry_col()
    records = list(t_col.find(
        {"session_id": session_id, "user_id": g.user_id},
        {"_id": 0}
    ).sort("frame_index", 1))

    if not records:
        return jsonify({"telemetry": [], "total_frames": 0}), 200

    total_frames = sum(r.get("sample_count", 1) for r in records)

    # Downsample if exceeding max_points
    if len(records) > max_points:
        step = len(records) / max_points
        downsampled = [records[int(i * step)] for i in range(max_points)]
    else:
        downsampled = records

    return jsonify({
        "telemetry": downsampled,
        "total_frames": total_frames,
        "sampled_frames": len(downsampled)
    }), 200


# ---------------------------------------------------------------------------
# GET /api/sessions/<session_id>/pdf — Stream PDF from GridFS
# ---------------------------------------------------------------------------
@sessions_bp.route("/<session_id>/pdf", methods=["GET"])
@require_auth
def download_session_pdf(session_id):
    """Streams stored session PDF from MongoDB GridFS directly to user."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        return jsonify({"error": "Invalid session ID format"}), 400

    col = sessions_col()
    session = col.find_one({"_id": oid, "user_id": g.user_id})
    if not session:
        return jsonify({"error": "Session not found"}), 404

    pdf_id_str = session.get("pdf_gridfs_id")
    if not pdf_id_str:
        return jsonify({"error": "No PDF report generated for this session"}), 404

    try:
        fs = get_fs()
        grid_out = fs.get(ObjectId(pdf_id_str))
        pdf_bytes = grid_out.read()

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"Ergonomic_Report_{session_id}.pdf"
        )
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve PDF: {str(e)}"}), 500


# ---------------------------------------------------------------------------
# DELETE /api/sessions/<session_id> — Delete session, telemetry, and GridFS PDF
# ---------------------------------------------------------------------------
@sessions_bp.route("/<session_id>", methods=["DELETE"])
@require_auth
def delete_session(session_id):
    """Deletes a session document, all associated telemetry rows, and GridFS PDF."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        return jsonify({"error": "Invalid session ID format"}), 400

    col = sessions_col()
    session = col.find_one({"_id": oid, "user_id": g.user_id})
    if not session:
        return jsonify({"error": "Session not found"}), 404

    # Remove PDF from GridFS if present
    pdf_id_str = session.get("pdf_gridfs_id")
    if pdf_id_str:
        try:
            fs = get_fs()
            fs.delete(ObjectId(pdf_id_str))
        except Exception as e:
            print(f"[!] Warning deleting GridFS PDF: {e}")

    # Remove telemetry
    try:
        t_col = telemetry_col()
        t_col.delete_many({"session_id": session_id, "user_id": g.user_id})
    except Exception as e:
        print(f"[!] Warning deleting telemetry: {e}")

    # Delete session
    col.delete_one({"_id": oid})
    return jsonify({"status": "deleted", "id": session_id}), 200


# ---------------------------------------------------------------------------
# GET /api/sessions/analytics/summary — Personalized user analytics
# ---------------------------------------------------------------------------
@sessions_bp.route("/analytics/summary", methods=["GET"])
@require_auth
def get_analytics_summary():
    """Computes aggregate analytics across user sessions and telemetry, filtered by period."""
    period = request.args.get("period", "week").lower()
    col = sessions_col()
    t_col = telemetry_col()

    # Determine cutoff date
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if period == "day":
        cutoff = now - timedelta(days=1)
    elif period == "month":
        cutoff = now - timedelta(days=30)
    else:  # default 'week'
        cutoff = now - timedelta(days=7)

    query = {"user_id": g.user_id, "started_at": {"$gte": cutoff}}
    sessions = list(col.find(query).sort("started_at", -1))
    total_sessions = len(sessions)

    if total_sessions == 0:
        return jsonify({
            "period": period,
            "total_sessions": 0,
            "total_monitoring_minutes": 0,
            "avg_posture_score": 0,
            "excellent_count": 0,
            "needs_work_count": 0,
            "safety_violations": 0,
            "avg_blink_rate": 15.0,
            "avg_distance_cm": 60.0,
            "distribution": {"safe": 0, "warning": 0, "danger": 0},
            "posture_distribution": {"SAFE": 0, "WARNING": 0, "DANGER": 0},
            "weekly_trend": [0, 0, 0, 0, 0, 0, 0],
            "trend_labels": []
        }), 200

    total_duration_sec = sum(s.get("duration_sec", 0) for s in sessions)
    total_monitoring_minutes = round(total_duration_sec / 60, 1)
    today = now.date()

    scores = []
    excellent_count = 0
    needs_work_count = 0
    violations_count = 0
    posture_counts = {"SAFE": 0, "WARNING": 0, "DANGER": 0}
    posture_scores_by_date = {}
    session_ids = [str(s["_id"]) for s in sessions]
    telemetry_for_sessions = t_col.find(
        {"session_id": {"$in": session_ids}, "user_id": g.user_id},
        {
            "session_id": 1,
            "status_counts": 1,
            "sample_count": 1,
            "final_status": 1,
            "_id": 0,
        },
    )

    records_by_session = {}
    for record in telemetry_for_sessions:
        records_by_session.setdefault(str(record["session_id"]), []).append(record)

    for s in sessions:
        stats = s.get("final_stats", {})
        status = stats.get("status", "SAFE").upper()

        calculated_score = stats.get("posture_score")
        try:
            calculated_score = round(float(calculated_score), 1)
        except (TypeError, ValueError):
            calculated_score = None

        session_records = records_by_session.get(str(s["_id"]), [])
        telemetry_score = _posture_score_from_telemetry(session_records)
        if telemetry_score is not None:
            calculated_score = telemetry_score

        if calculated_score is not None:
            score = max(0, min(100, calculated_score))
        else:
            continue
        scores.append(score)

        if score >= 90:
            posture_counts["SAFE"] += 1
            excellent_count += 1
        elif score >= 60:
            posture_counts["WARNING"] += 1
            needs_work_count += 1
            violations_count += 1
        else:
            posture_counts["DANGER"] += 1
            needs_work_count += 1
            violations_count += 2

        started_at = s.get("started_at")
        if started_at:
            if period == "day":
                bucket_key = f"hour-{(started_at.hour // 4) * 4:02d}"
            elif period == "month":
                age_days = max(0, min(29, (today - started_at.date()).days))
                bucket_index = min(6, (29 - age_days) // 5)
                bucket_key = f"bucket-{bucket_index}"
            else:
                bucket_key = started_at.date().isoformat()
            posture_scores_by_date.setdefault(bucket_key, []).append(score)

    avg_score = round(sum(scores) / len(scores)) if scores else 90

    # Calculate real posture distribution percentages
    total_posture_marks = sum(posture_counts.values()) or 1
    safe_pct = round((posture_counts["SAFE"] / total_posture_marks) * 100)
    warning_pct = round((posture_counts["WARNING"] / total_posture_marks) * 100)
    danger_pct = max(0, 100 - (safe_pct + warning_pct))

    # Query telemetry sample for average distance and blink rate
    session_ids = [str(s["_id"]) for s in sessions]
    recent_telemetry = list(t_col.find(
        {"session_id": {"$in": session_ids}, "user_id": g.user_id},
        {
            "estimated_distance_cm": 1,
            "blink_rate_per_min": 1,
            "sample_count": 1,
            "final_status": 1,
        }
    ))

    avg_dist = 60.0
    avg_blink = 15.0
    if recent_telemetry:
        weighted_dists = [
            (r["estimated_distance_cm"], r.get("sample_count", 1))
            for r in recent_telemetry if r.get("estimated_distance_cm") is not None
        ]
        weighted_blinks = [
            (r["blink_rate_per_min"], r.get("sample_count", 1))
            for r in recent_telemetry if r.get("blink_rate_per_min") is not None
        ]
        if weighted_dists:
            avg_dist = round(
                sum(value * count for value, count in weighted_dists)
                / sum(count for _, count in weighted_dists), 1
            )
        if weighted_blinks:
            avg_blink = round(
                sum(value * count for value, count in weighted_blinks)
                / sum(count for _, count in weighted_blinks), 1
            )

    # Build a real seven-point trend. Missing periods are 0, never padded with
    # the user's average, which would falsely imply activity on inactive days.
    trend_labels = []
    weekly_trend = []
    if period == "day":
        for hour in range(0, 24, 4):
            bucket_key = f"hour-{hour:02d}"
            bucket_scores = posture_scores_by_date.get(bucket_key, [])
            trend_labels.append(f"{hour:02d}:00")
            weekly_trend.append(
                round(sum(bucket_scores) / len(bucket_scores), 1) if bucket_scores else 0
            )
    elif period == "month":
        for bucket_index in range(7):
            bucket_key = f"bucket-{bucket_index}"
            bucket_scores = posture_scores_by_date.get(bucket_key, [])
            start_day = today - timedelta(days=29 - bucket_index * 5)
            trend_labels.append(start_day.strftime("%d %b"))
            weekly_trend.append(
                round(sum(bucket_scores) / len(bucket_scores), 1) if bucket_scores else 0
            )
    else:
        today = now.date()
        for offset in range(6, -1, -1):
            date_key = (today - timedelta(days=offset)).isoformat()
            day_scores = posture_scores_by_date.get(date_key, [])
            trend_labels.append((today - timedelta(days=offset)).strftime("%a"))
            weekly_trend.append(
                round(sum(day_scores) / len(day_scores), 1) if day_scores else 0
            )

    return jsonify({
        "period": period,
        "total_sessions": total_sessions,
        "total_monitoring_minutes": total_monitoring_minutes,
        "avg_posture_score": avg_score,
        "excellent_count": excellent_count,
        "needs_work_count": needs_work_count,
        "safety_violations": violations_count,
        "avg_blink_rate": avg_blink,
        "avg_distance_cm": avg_dist,
        "distribution": {
            "safe": safe_pct,
            "warning": warning_pct,
            "danger": danger_pct
        },
        "posture_distribution": posture_counts,
        "weekly_trend": weekly_trend,
        "trend_labels": trend_labels
    }), 200

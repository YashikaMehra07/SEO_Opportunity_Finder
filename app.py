from flask import Flask, render_template, request
import functions as fn

app = Flask(__name__)

def build_dashboard_data(keyword):
    keyword = keyword.lower().strip()

    # Prediction
    priority, confidence = fn.predict_priority(keyword)

    # Intent
    intent = fn.extract_intent(keyword)

    # Metrics
    seo_metrics = fn.get_seo_metrics(keyword)
    serp_metrics = fn.get_serp_metrics(keyword)

    # Content mix
    content_mix, dominant_content = fn.get_content_mix(keyword)

    # Competitors
    competitors = fn.get_top_competitors(keyword)

    # Similar keywords
    similar_df, _ = fn.get_similar_keywords(
        keyword, df=fn.SEO_DF, vec=fn.SEO_VEC, top_k=10
    )

    recommendations = []
    keyword_graph_data = []

    for _, row in similar_df.iterrows():
        k = row["keyword"]

        p, _ = fn.predict_priority(k)

        if p in ["High", "Medium"]:
            recommendations.append({
                "keyword": k,
                "priority": p
            })

            keyword_graph_data.append({
                "keyword": k,
                "search_volume":float(row.get("search_vol_log", 0)),  
                "difficulty": float(row.get("keyword_difficulty", 0)),
                "competition": float(row.get("competition", 0))
            })

    return {
        "keyword": keyword,
        "priority": priority,
        "confidence": confidence,
        "intent": intent,

        "serp": {
            **seo_metrics,
            **serp_metrics,
            "content_type": dominant_content,
            "content_mix": content_mix,
            "competitors": competitors
        },

        "recommendations": recommendations[:8],
        "keyword_graph": keyword_graph_data
    }

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/dashboard", methods=["POST"])
def dashboard():
    keyword = request.form["keyword"]
    data = build_dashboard_data(keyword)
    return render_template("dashboard.html", data=data)

if __name__ == "__main__":
    app.run(debug=True)
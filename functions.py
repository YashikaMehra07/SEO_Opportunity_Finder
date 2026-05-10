import pandas as pd
import joblib
from scipy.sparse import hstack
from sklearn.metrics.pairwise import cosine_similarity

#Load

model = joblib.load("saved/keyword_model.pkl")
seo_vectorizer = joblib.load("saved/vectorizer.pkl")
num_cols = joblib.load("saved/feature_columns.pkl") 
#gives list of numeric columns used for model prediction


SEO_DF= pd.read_excel("data/SEO_Expanded.xlsx")
SEO_DF.columns=SEO_DF.columns.str.lower().str.strip()
SEO_VEC= seo_vectorizer.transform(SEO_DF['keyword']) 
X_num=SEO_DF[num_cols]

SERP_DF = pd.read_excel("data/SERP_Final.xlsx")

SERP_DF.columns = SERP_DF.columns.str.lower().str.strip()

SERP_VEC = seo_vectorizer.transform(SERP_DF["keyword"].unique())

#to get similar keywords
def get_similar_keywords(keyword, df, vec,top_k=5, threshold=0.3):
    keyword = keyword.lower().strip()
    key_vec = seo_vectorizer.transform([keyword])

    sims = cosine_similarity(key_vec, vec)[0] 
    #prediction based on word similarity with searched keyword and keywords from dataset

    indices = [i for i in range(len(sims)) if sims[i] > threshold]

    if len(indices) == 0:
        indices = sims.argsort()[-top_k:]  #low to high sort take top 3

    return df.iloc[indices], sims #return the df of top vals and similarities

def safe_mean(series):
    val = series.mean()
    return round(float(val), 2) if pd.notna(val) else 0

def format_volume(num):
    if num >= 1_000_000_000:
        return f"{num / 1_000_000_000:.1f}B"
    elif num >= 1_000_000:
        return f"{num / 1_000_000:.1f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.1f}K"
    else:
        return str(round(num))

#fn to get intent to display in ML prediction section
def extract_intent(key):
    key=key.lower().strip()
    informational_words = [
    "what is", "how", "why", "when", "where", "who", "which",
    "guide", "tutorial", "course", "learn", "tips",
    "examples", "meaning", "definition", "benefits",
    "difference", "strategy", "process", "checklist",
    "internship", "job", "salary", "fresher",
    "vacancy", "career", "opening"
]

    commercial_words = [
    "best", "top", "vs", "versus", "compare", "comparison",
    "review", "reviews", "alternatives", "pricing", "plans",
    "features", "affordable", "professional", "recommended",
    "agency", "service", "company", "expert","agencies", 'services',
    "software", "tool", "tools", "platform", "solution", 'companies',
    "hire", "contact", "quote"
]

    transactional_words = [
    "buy", "purchase", "hire", "book", "order", "download",
    "subscribe", "apply", "register", "contact", "demo",
    "trial", "quote", "discount", "sale",
    "near me", "nearby",
    "ahmedabad", "delhi", "mumbai", "india", "companies",
    "agency", "service", "company", "expert", "agencies", 'services'
]
    features={"Informational": 0,"Commercial": 0, "Transactional": 0}
    for word in key.split():
        if (word in informational_words):
            features["Informational"] += 1
        if (word in commercial_words):
            features["Commercial"] += 1
        if (word in transactional_words):
            features["Transactional"] += 1
        
    intent= max(features, key=features.get) 
    return intent


#predictor fn returns priority and confidence
def predict_priority(key):
    key=key.lower().strip()
    key_vec=seo_vectorizer.transform([key])
    top_df, sims = get_similar_keywords(key, top_k=3, df=SEO_DF, vec=SEO_VEC)
    top_indices = top_df.index #gives index labels
    estimated_features=X_num.loc[top_indices].mean(axis=0) #coulmn wise mean
    final_features=hstack([estimated_features.values.reshape(1,-1), key_vec]) #join
    #1row and n no. of columns returns2D array 1row x cols
    
    priority={0:'Low', 1: 'Medium', 2:'High'}
    preds=model.predict(final_features)
    conf= model.predict_proba(final_features).max()
    return priority[preds[0]], round(float(conf),3)

#fn to get metrics to display in serp insights  
def get_seo_metrics(keyword):
    top_df, sims = get_similar_keywords(keyword, top_k=5, df=SEO_DF, vec=SEO_VEC)

    return {
    "avg_difficulty": safe_mean(top_df['keyword_difficulty']),
    "avg_competition": safe_mean(top_df['competition']),
    "avg_rank_gap": safe_mean(top_df['rank_gap']),
    "avg_search_volume": format_volume(safe_mean(round(10 **(top_df['search_vol_log'])))),
}

#to get other metrics for serp insights
def get_serp_metrics(keyword):
    top_df, sims = get_similar_keywords(keyword, df= SERP_DF, vec=SERP_VEC, top_k=5)

    return {
    "avg_backlinks": format_volume(safe_mean(top_df['backlinks'])),
    "avg_traffic": format_volume(safe_mean(top_df['organic_traffic'])),
    "avg_ranking_keywords": safe_mean(top_df['ranking_keywords']),
    "avg_ref_domains": safe_mean(top_df['referring_domains']) if 'referring_domains' in top_df.columns else 0
}
#to get top 10 competitors 
def get_top_competitors(keyword, top_n=10):
    top_df, sims = get_similar_keywords(keyword, df= SERP_DF, vec=SERP_VEC, top_k=top_n)

    competitors = []

    for _, row in top_df.iterrows():
        competitors.append({
            "company_name": row.get("company_name", ""),
            "ranking": row.get("ranking", ""),
            "backlinks": row.get("backlinks", 0),
            "traffic": row.get("organic_traffic", 0),
            "ranking_keywords": row.get("ranking_keywords", 0),
            "content_type": row.get("content_type", "")
        })

    return competitors


def get_content_mix(keyword):
    top_df, _ = get_similar_keywords(keyword, df= SERP_DF, vec=SERP_VEC)

    counts = top_df['content_type'].value_counts()

    content_mix = [
        {"type": k, "count": int(v)}
        for k, v in counts.items()
    ]

    dominant = counts.idxmax() if not counts.empty else "Unknown"

    return content_mix, dominant


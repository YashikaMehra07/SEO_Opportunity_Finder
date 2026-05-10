# SEO_Opportunity_Finder
SEO Opportunity Finder is an AI-powered SEO analysis platform that automates keyword research, predicts keyword priority using Machine Learning, and provides intelligent content and SERP competitor insights to support data-driven content strategy.

## Features
- Keyword Priority Prediction using Machine Learning
- TF-IDF based keyword recommendations
- SERP competitor analysis
- Content strategy insights
- Interactive dashboard visualizations
- Multi-source SEO data integration

## Tech Stack
- Python
- Scikit-learn
- Pandas & NumPy
- Flask
- HTML/CSS/JavaScript

## Project Structure
```
C:.
│   app.py              #Main app
│   functions.py        #Backend logic functions
│
├───data/       #Data Files used for analysis and recommendation
│
├───saved/      #Saved models used in main app
│
├───static/     #CSS, JS                     
│
├───templates/  #HTML templates
|
├── requirements.txt
├── .gitignore
└── README.md
```

## Workflow
1. User enters a keyword  
2. Similar keywords are retrieved using TF-IDF + cosine similarity  
3. Features are processed and passed to the ML model  
4. Keyword priority is predicted  
5. SERP insights and recommendations are generated  
6. Results are displayed on the dashboard  

## Model Performance
- Decision Tree Classifier
- ~88% accuracy

## Author & Contribution
This project was developed as part of a team.

My contributions included:
- Data collection from multiple SEO tools
- Data cleaning, preprocessing and feature engineering
- Keyword similarity & recommendation logic
- Dashboard/backend integration
  

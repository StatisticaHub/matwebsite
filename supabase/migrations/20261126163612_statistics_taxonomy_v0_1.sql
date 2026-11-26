-- ============================================================
-- MAT Academic Knowledge Engine
-- Statistics Taxonomy v0.1
--
-- Initial canonical structure only.
-- Detailed teaching content will be introduced separately.
-- ============================================================


-- ============================================================
-- SUBJECT
-- ============================================================

insert into public.academic_subjects (
  slug,
  name,
  description,
  lifecycle_status,
  sort_order
)
values (
  'statistics',
  'Statistics',
  'Statistical reasoning, probability, inference, modelling and interpretation from foundational university study through applied research.',
  'approved',
  10
)
on conflict (slug)
do update set
  name = excluded.name,
  description = excluded.description,
  lifecycle_status = excluded.lifecycle_status,
  sort_order = excluded.sort_order,
  updated_at = now();


-- ============================================================
-- DOMAINS
-- ============================================================

insert into public.academic_domains (
  subject_id,
  slug,
  name,
  description,
  lifecycle_status,
  sort_order
)
select
  s.id,
  d.slug,
  d.name,
  d.description,
  'approved',
  d.sort_order
from public.academic_subjects s
cross join (
  values
    (
      'statistical-foundations',
      'Statistical Foundations',
      'Core statistical language, data structures, populations, samples, variables and study reasoning.',
      10
    ),
    (
      'descriptive-statistics',
      'Descriptive Statistics',
      'Methods for summarising, visualising and describing distributions and relationships.',
      20
    ),
    (
      'probability',
      'Probability',
      'Probability rules, conditional probability, independence and probabilistic reasoning.',
      30
    ),
    (
      'random-variables-distributions',
      'Random Variables & Distributions',
      'Discrete and continuous random variables, expectation, variance and common probability distributions.',
      40
    ),
    (
      'sampling-estimation',
      'Sampling & Estimation',
      'Sampling distributions, point estimation, standard errors and confidence intervals.',
      50
    ),
    (
      'hypothesis-testing',
      'Hypothesis Testing',
      'Null hypotheses, test statistics, p-values, significance, errors and statistical power.',
      60
    ),
    (
      'correlation-regression',
      'Correlation & Regression',
      'Association, least squares, linear regression, model assumptions and interpretation.',
      70
    ),
    (
      'anova-experimental-design',
      'ANOVA & Experimental Design',
      'Comparing group means, variance decomposition and principles of experimental design.',
      80
    ),
    (
      'nonparametric-methods',
      'Nonparametric Methods',
      'Rank-based and distribution-light approaches for comparison and association.',
      90
    ),
    (
      'categorical-data',
      'Categorical Data Analysis',
      'Contingency tables, proportions, chi-square methods and modelling categorical outcomes.',
      100
    ),
    (
      'survival-analysis',
      'Survival Analysis',
      'Time-to-event data, censoring, survival functions and regression models for survival outcomes.',
      110
    ),
    (
      'statistical-practice',
      'Statistical Practice & Reproducibility',
      'Model checking, interpretation, statistical software, reproducibility and responsible reporting.',
      120
    )
) as d(slug, name, description, sort_order)
where s.slug = 'statistics'
on conflict (subject_id, slug)
do update set
  name = excluded.name,
  description = excluded.description,
  lifecycle_status = excluded.lifecycle_status,
  sort_order = excluded.sort_order,
  updated_at = now();


-- ============================================================
-- TOPICS
-- ============================================================

insert into public.academic_topics (
  domain_id,
  slug,
  name,
  description,
  lifecycle_status,
  sort_order
)
select
  d.id,
  t.slug,
  t.name,
  t.description,
  'approved',
  t.sort_order
from public.academic_domains d
join public.academic_subjects s
  on s.id = d.subject_id
join (
  values

    -- Statistical Foundations
    (
      'statistical-foundations',
      'data-and-variables',
      'Data & Variables',
      'Data types, variables, observations and measurement.',
      10
    ),
    (
      'statistical-foundations',
      'populations-and-samples',
      'Populations & Samples',
      'Populations, samples, parameters and statistics.',
      20
    ),
    (
      'statistical-foundations',
      'study-design-foundations',
      'Study Design Foundations',
      'Observational studies, experiments, bias and confounding.',
      30
    ),

    -- Descriptive Statistics
    (
      'descriptive-statistics',
      'measures-of-centre',
      'Measures of Centre',
      'Mean, median and other descriptions of central tendency.',
      10
    ),
    (
      'descriptive-statistics',
      'measures-of-spread',
      'Measures of Spread',
      'Variance, standard deviation, range and interquartile range.',
      20
    ),
    (
      'descriptive-statistics',
      'distribution-shape',
      'Distribution Shape',
      'Skewness, symmetry, outliers and graphical summaries.',
      30
    ),

    -- Probability
    (
      'probability',
      'probability-rules',
      'Probability Rules',
      'Events, complements, unions, intersections and probability laws.',
      10
    ),
    (
      'probability',
      'conditional-probability',
      'Conditional Probability',
      'Conditional probability, independence and Bayes reasoning.',
      20
    ),

    -- Random Variables
    (
      'random-variables-distributions',
      'random-variables',
      'Random Variables',
      'Discrete and continuous random variables and probability functions.',
      10
    ),
    (
      'random-variables-distributions',
      'expectation-and-variance',
      'Expectation & Variance',
      'Expected values, variance and transformations.',
      20
    ),
    (
      'random-variables-distributions',
      'discrete-distributions',
      'Discrete Distributions',
      'Bernoulli, binomial, geometric and Poisson distributions.',
      30
    ),
    (
      'random-variables-distributions',
      'continuous-distributions',
      'Continuous Distributions',
      'Uniform, exponential, gamma and normal distributions.',
      40
    ),

    -- Sampling and estimation
    (
      'sampling-estimation',
      'sampling-distributions',
      'Sampling Distributions',
      'Sampling behaviour of statistics and the central limit theorem.',
      10
    ),
    (
      'sampling-estimation',
      'point-estimation',
      'Point Estimation',
      'Estimators, bias, variance and consistency.',
      20
    ),
    (
      'sampling-estimation',
      'confidence-intervals',
      'Confidence Intervals',
      'Interval estimation for means and proportions.',
      30
    ),

    -- Hypothesis Testing
    (
      'hypothesis-testing',
      'testing-framework',
      'Hypothesis Testing Framework',
      'Null and alternative hypotheses, test statistics and decision rules.',
      10
    ),
    (
      'hypothesis-testing',
      'p-values-significance',
      'P-values & Statistical Significance',
      'Meaning and interpretation of p-values and significance levels.',
      20
    ),
    (
      'hypothesis-testing',
      'errors-and-power',
      'Errors & Power',
      'Type I error, Type II error and statistical power.',
      30
    ),

    -- Regression
    (
      'correlation-regression',
      'correlation',
      'Correlation',
      'Pearson and rank-based descriptions of association.',
      10
    ),
    (
      'correlation-regression',
      'simple-linear-regression',
      'Simple Linear Regression',
      'Least squares estimation and interpretation in simple regression.',
      20
    ),
    (
      'correlation-regression',
      'multiple-linear-regression',
      'Multiple Linear Regression',
      'Regression with multiple predictors and adjusted interpretation.',
      30
    ),
    (
      'correlation-regression',
      'regression-diagnostics',
      'Regression Diagnostics',
      'Model assumptions, residuals, influence and model adequacy.',
      40
    ),

    -- ANOVA
    (
      'anova-experimental-design',
      'one-way-anova',
      'One-Way ANOVA',
      'Comparing several population means using variance decomposition.',
      10
    ),
    (
      'anova-experimental-design',
      'experimental-design',
      'Experimental Design',
      'Randomisation, replication, blocking and experimental structure.',
      20
    ),

    -- Nonparametric
    (
      'nonparametric-methods',
      'rank-based-tests',
      'Rank-Based Tests',
      'Wilcoxon, Mann-Whitney and related rank-based comparisons.',
      10
    ),

    -- Categorical
    (
      'categorical-data',
      'contingency-tables',
      'Contingency Tables',
      'Counts, proportions and relationships between categorical variables.',
      10
    ),
    (
      'categorical-data',
      'chi-square-tests',
      'Chi-Square Methods',
      'Goodness-of-fit and independence testing.',
      20
    ),
    (
      'categorical-data',
      'logistic-regression',
      'Logistic Regression',
      'Regression modelling for binary outcomes.',
      30
    ),

    -- Survival
    (
      'survival-analysis',
      'survival-data',
      'Survival Data & Censoring',
      'Time-to-event outcomes and censoring mechanisms.',
      10
    ),
    (
      'survival-analysis',
      'kaplan-meier',
      'Kaplan-Meier Analysis',
      'Nonparametric estimation and comparison of survival functions.',
      20
    ),
    (
      'survival-analysis',
      'cox-regression',
      'Cox Proportional Hazards Regression',
      'Semi-parametric modelling of hazard ratios.',
      30
    ),

    -- Practice
    (
      'statistical-practice',
      'model-interpretation',
      'Statistical Interpretation',
      'Translating statistical results into defensible conclusions.',
      10
    ),
    (
      'statistical-practice',
      'reproducible-analysis',
      'Reproducible Statistical Analysis',
      'Structured analysis workflows, code, documentation and reproducibility.',
      20
    )

) as t(domain_slug, slug, name, description, sort_order)
  on t.domain_slug = d.slug
where s.slug = 'statistics'
on conflict (domain_id, slug)
do update set
  name = excluded.name,
  description = excluded.description,
  lifecycle_status = excluded.lifecycle_status,
  sort_order = excluded.sort_order,
  updated_at = now();


-- ============================================================
-- CONCEPTS
-- ============================================================

insert into public.academic_concepts (
  topic_id,
  slug,
  name,
  summary,
  difficulty,
  estimated_learning_minutes,
  lifecycle_status,
  sort_order
)
select
  t.id,
  c.slug,
  c.name,
  c.summary,
  c.difficulty,
  c.minutes,
  'approved',
  c.sort_order
from public.academic_topics t
join public.academic_domains d
  on d.id = t.domain_id
join public.academic_subjects s
  on s.id = d.subject_id
join (
  values

    ('data-and-variables','data-types','Data Types',
     'Distinguish numerical, categorical, discrete and continuous data.',1,30,10),

    ('data-and-variables','levels-of-measurement','Levels of Measurement',
     'Understand nominal, ordinal, interval and ratio measurement scales.',1,30,20),

    ('populations-and-samples','population-sample','Population and Sample',
     'Distinguish the target population from an observed sample.',1,25,10),

    ('populations-and-samples','parameter-statistic','Parameter and Statistic',
     'Distinguish fixed population quantities from sample-based statistics.',1,25,20),

    ('study-design-foundations','confounding','Confounding',
     'Understand how a third variable can distort an observed association.',2,45,10),

    ('study-design-foundations','bias','Bias',
     'Recognise systematic mechanisms that can distort estimates or conclusions.',2,45,20),

    ('measures-of-centre','arithmetic-mean','Arithmetic Mean',
     'Understand the sample and population mean and their interpretation.',1,30,10),

    ('measures-of-centre','median','Median',
     'Understand the median as a robust measure of central location.',1,25,20),

    ('measures-of-spread','variance','Variance',
     'Understand variance as average squared deviation from the mean.',2,45,10),

    ('measures-of-spread','standard-deviation','Standard Deviation',
     'Interpret standard deviation in the original scale of measurement.',2,35,20),

    ('measures-of-spread','interquartile-range','Interquartile Range',
     'Understand the IQR as the spread of the middle fifty percent of observations.',1,30,30),

    ('distribution-shape','skewness','Skewness',
     'Recognise and interpret asymmetric distributions.',1,30,10),

    ('distribution-shape','outliers','Outliers',
     'Identify unusually extreme observations and reason about their influence.',2,35,20),

    ('probability-rules','addition-rule','Addition Rule',
     'Calculate probabilities involving unions of events.',2,35,10),

    ('probability-rules','multiplication-rule','Multiplication Rule',
     'Calculate joint probabilities using conditional probability.',2,40,20),

    ('conditional-probability','conditional-probability','Conditional Probability',
     'Calculate and interpret probability conditional on known information.',2,45,10),

    ('conditional-probability','independence','Statistical Independence',
     'Determine whether knowledge of one event changes the probability of another.',2,40,20),

    ('conditional-probability','bayes-theorem','Bayes Theorem',
     'Reverse conditional probabilities using Bayes theorem.',3,60,30),

    ('random-variables','discrete-random-variable','Discrete Random Variable',
     'Represent countable random outcomes numerically.',2,40,10),

    ('random-variables','continuous-random-variable','Continuous Random Variable',
     'Represent random quantities defined over continuous ranges.',2,40,20),

    ('expectation-and-variance','expected-value','Expected Value',
     'Calculate and interpret the long-run expectation of a random variable.',2,50,10),

    ('expectation-and-variance','variance-random-variable','Variance of a Random Variable',
     'Quantify variability of a random variable around its expectation.',3,50,20),

    ('discrete-distributions','bernoulli-distribution','Bernoulli Distribution',
     'Model a single binary trial.',2,35,10),

    ('discrete-distributions','binomial-distribution','Binomial Distribution',
     'Model the number of successes in repeated independent Bernoulli trials.',2,50,20),

    ('discrete-distributions','poisson-distribution','Poisson Distribution',
     'Model event counts occurring over a fixed interval.',2,50,30),

    ('continuous-distributions','exponential-distribution','Exponential Distribution',
     'Model waiting times under a constant event rate.',2,45,10),

    ('continuous-distributions','gamma-distribution','Gamma Distribution',
     'Model positive continuous quantities and accumulated waiting times.',3,60,20),

    ('continuous-distributions','normal-distribution','Normal Distribution',
     'Understand properties and standardisation of the Gaussian distribution.',2,60,30),

    ('sampling-distributions','sampling-distribution','Sampling Distribution',
     'Understand the distribution of a statistic across repeated samples.',3,55,10),

    ('sampling-distributions','central-limit-theorem','Central Limit Theorem',
     'Understand why many sample means become approximately normally distributed.',3,60,20),

    ('sampling-distributions','standard-error','Standard Error',
     'Quantify sampling variability of an estimator.',3,45,30),

    ('point-estimation','estimator-bias','Bias of an Estimator',
     'Understand systematic deviation of an estimator from its target parameter.',3,45,10),

    ('point-estimation','estimator-consistency','Consistency',
     'Understand convergence of an estimator toward the true parameter.',4,50,20),

    ('confidence-intervals','confidence-interval-mean','Confidence Interval for a Mean',
     'Construct and interpret an interval estimate for a population mean.',3,60,10),

    ('confidence-intervals','confidence-interval-proportion','Confidence Interval for a Proportion',
     'Construct and interpret an interval estimate for a population proportion.',3,60,20),

    ('testing-framework','null-alternative-hypotheses','Null and Alternative Hypotheses',
     'Formulate competing statistical hypotheses.',2,40,10),

    ('testing-framework','test-statistic','Test Statistic',
     'Understand how sample information is converted into evidence against a null hypothesis.',3,45,20),

    ('p-values-significance','p-value','P-value',
     'Interpret the probability of observing evidence at least as extreme under the null model.',3,60,10),

    ('p-values-significance','significance-level','Significance Level',
     'Understand the role of alpha in frequentist hypothesis testing.',2,40,20),

    ('errors-and-power','type-i-error','Type I Error',
     'Understand false rejection of a true null hypothesis.',2,35,10),

    ('errors-and-power','type-ii-error','Type II Error',
     'Understand failure to reject a false null hypothesis.',2,35,20),

    ('errors-and-power','statistical-power','Statistical Power',
     'Understand the probability of detecting an effect when it truly exists.',3,55,30),

    ('correlation','pearson-correlation','Pearson Correlation',
     'Measure linear association between two quantitative variables.',2,45,10),

    ('correlation','spearman-correlation','Spearman Rank Correlation',
     'Measure monotonic association using ranked observations.',2,45,20),

    ('simple-linear-regression','least-squares','Ordinary Least Squares',
     'Estimate regression coefficients by minimising squared residuals.',3,75,10),

    ('simple-linear-regression','regression-intercept','Regression Intercept',
     'Interpret the fitted response when the predictor equals zero.',2,35,20),

    ('simple-linear-regression','regression-slope','Regression Slope',
     'Interpret expected change in outcome per unit increase in the predictor.',2,40,30),

    ('simple-linear-regression','ols-sampling-properties','Sampling Properties of OLS Estimators',
     'Understand expectation, variance and sampling behaviour of least-squares estimators.',4,90,40),

    ('multiple-linear-regression','adjusted-coefficient','Adjusted Regression Coefficient',
     'Interpret a predictor coefficient conditional on other variables in the model.',3,60,10),

    ('multiple-linear-regression','multicollinearity','Multicollinearity',
     'Understand instability arising from strongly related predictors.',3,50,20),

    ('regression-diagnostics','residual-analysis','Residual Analysis',
     'Use residuals to assess linear model assumptions and model adequacy.',3,60,10),

    ('regression-diagnostics','heteroskedasticity','Heteroskedasticity',
     'Recognise non-constant residual variance and its inferential consequences.',4,60,20),

    ('one-way-anova','anova-f-statistic','ANOVA F Statistic',
     'Compare between-group and within-group variability.',3,60,10),

    ('experimental-design','randomisation','Randomisation',
     'Use random allocation to protect causal comparisons from systematic differences.',2,40,10),

    ('experimental-design','blocking','Blocking',
     'Control known sources of variation through structured experimental design.',3,45,20),

    ('rank-based-tests','mann-whitney-u','Mann-Whitney U Test',
     'Compare two independent groups using ranked observations.',3,50,10),

    ('rank-based-tests','wilcoxon-signed-rank','Wilcoxon Signed-Rank Test',
     'Compare paired observations using signed ranks.',3,50,20),

    ('contingency-tables','two-way-contingency-table','Two-Way Contingency Table',
     'Summarise joint frequencies of two categorical variables.',2,35,10),

    ('chi-square-tests','chi-square-independence','Chi-Square Test of Independence',
     'Test association between categorical variables using observed and expected counts.',3,55,10),

    ('logistic-regression','odds','Odds',
     'Express probability on the odds scale.',2,35,10),

    ('logistic-regression','odds-ratio','Odds Ratio',
     'Compare odds between exposure or predictor groups.',3,45,20),

    ('logistic-regression','logistic-regression-coefficient','Logistic Regression Coefficient',
     'Interpret predictor effects on the log-odds and odds-ratio scales.',4,70,30),

    ('survival-data','right-censoring','Right Censoring',
     'Understand incomplete observation of event times after study follow-up ends.',3,45,10),

    ('survival-data','survival-function','Survival Function',
     'Represent probability of remaining event-free beyond a given time.',3,45,20),

    ('survival-data','hazard-function','Hazard Function',
     'Represent instantaneous event rate among individuals still at risk.',4,60,30),

    ('kaplan-meier','kaplan-meier-estimator','Kaplan-Meier Estimator',
     'Estimate survival probabilities nonparametrically under censoring.',4,70,10),

    ('kaplan-meier','log-rank-test','Log-Rank Test',
     'Compare survival experiences between groups.',4,60,20),

    ('cox-regression','proportional-hazards','Proportional Hazards Assumption',
     'Understand the constant hazard-ratio assumption of the Cox model.',4,60,10),

    ('cox-regression','cox-model','Cox Proportional Hazards Model',
     'Model covariate effects on the hazard without specifying the baseline hazard.',4,90,20),

    ('model-interpretation','statistical-practical-significance','Statistical vs Practical Significance',
     'Distinguish statistical evidence from scientific or practical importance.',2,45,10),

    ('reproducible-analysis','reproducible-workflow','Reproducible Analysis Workflow',
     'Structure code, data, outputs and documentation so analyses can be recreated.',2,60,10)

) as c(
  topic_slug,
  slug,
  name,
  summary,
  difficulty,
  minutes,
  sort_order
)
  on c.topic_slug = t.slug
where s.slug = 'statistics'
on conflict (topic_id, slug)
do update set
  name = excluded.name,
  summary = excluded.summary,
  difficulty = excluded.difficulty,
  estimated_learning_minutes = excluded.estimated_learning_minutes,
  lifecycle_status = excluded.lifecycle_status,
  sort_order = excluded.sort_order,
  updated_at = now();


-- ============================================================
-- INITIAL PREREQUISITE GRAPH
-- ============================================================

with concept_lookup as (
  select
    c.id,
    c.slug
  from public.academic_concepts c
  join public.academic_topics t
    on t.id = c.topic_id
  join public.academic_domains d
    on d.id = t.domain_id
  join public.academic_subjects s
    on s.id = d.subject_id
  where s.slug = 'statistics'
),
relations(source_slug, target_slug) as (
  values
    ('population-sample','parameter-statistic'),
    ('arithmetic-mean','variance'),
    ('variance','standard-deviation'),
    ('conditional-probability','bayes-theorem'),
    ('expected-value','variance-random-variable'),
    ('bernoulli-distribution','binomial-distribution'),
    ('sampling-distribution','central-limit-theorem'),
    ('central-limit-theorem','standard-error'),
    ('standard-error','confidence-interval-mean'),
    ('standard-error','confidence-interval-proportion'),
    ('null-alternative-hypotheses','test-statistic'),
    ('test-statistic','p-value'),
    ('significance-level','type-i-error'),
    ('type-i-error','statistical-power'),
    ('type-ii-error','statistical-power'),
    ('arithmetic-mean','least-squares'),
    ('variance','least-squares'),
    ('least-squares','regression-intercept'),
    ('least-squares','regression-slope'),
    ('least-squares','ols-sampling-properties'),
    ('regression-slope','adjusted-coefficient'),
    ('adjusted-coefficient','multicollinearity'),
    ('least-squares','residual-analysis'),
    ('odds','odds-ratio'),
    ('odds-ratio','logistic-regression-coefficient'),
    ('right-censoring','survival-function'),
    ('survival-function','kaplan-meier-estimator'),
    ('hazard-function','cox-model'),
    ('proportional-hazards','cox-model')
)
insert into public.academic_concept_relations (
  source_concept_id,
  target_concept_id,
  relation_type,
  note
)
select
  source.id,
  target.id,
  'prerequisite_of',
  'Initial Statistics taxonomy prerequisite'
from relations r
join concept_lookup source
  on source.slug = r.source_slug
join concept_lookup target
  on target.slug = r.target_slug
on conflict (
  source_concept_id,
  target_concept_id,
  relation_type
)
do nothing;

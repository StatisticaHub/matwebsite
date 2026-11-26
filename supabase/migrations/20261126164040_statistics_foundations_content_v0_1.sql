-- ============================================================
-- MAT Academic Knowledge Engine
-- Statistics Foundations Content v0.1
--
-- First canonical academic content pack.
--
-- IMPORTANT:
-- Content remains DRAFT until human academic review.
-- ============================================================


-- ============================================================
-- LEARNING OBJECTIVES
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
objectives(concept_slug, objective, objective_type, sort_order) as (
  values

  ('data-types',
   'Classify variables as categorical or numerical and distinguish discrete from continuous numerical variables.',
   'understand', 10),

  ('data-types',
   'Select statistical summaries that are appropriate for different variable types.',
   'apply', 20),

  ('levels-of-measurement',
   'Distinguish nominal, ordinal, interval and ratio measurement scales.',
   'understand', 10),

  ('levels-of-measurement',
   'Explain how measurement scale influences meaningful statistical operations.',
   'analyse', 20),

  ('population-sample',
   'Distinguish a target population from a sample observed from that population.',
   'understand', 10),

  ('population-sample',
   'Identify the population and sample in an applied research scenario.',
   'apply', 20),

  ('parameter-statistic',
   'Distinguish a population parameter from a sample statistic.',
   'understand', 10),

  ('parameter-statistic',
   'Recognise commonly used parameters and their corresponding estimators.',
   'apply', 20),

  ('confounding',
   'Explain how a confounder can distort an observed exposure-outcome relationship.',
   'understand', 10),

  ('confounding',
   'Identify plausible confounding variables in observational studies.',
   'analyse', 20),

  ('bias',
   'Explain bias as systematic departure from the target quantity or truth.',
   'understand', 10),

  ('bias',
   'Distinguish common forms of selection and information bias in study scenarios.',
   'analyse', 20),

  ('arithmetic-mean',
   'Calculate the arithmetic mean from observed numerical data.',
   'apply', 10),

  ('arithmetic-mean',
   'Explain how extreme observations affect the arithmetic mean.',
   'analyse', 20),

  ('median',
   'Determine the median for ordered numerical observations.',
   'apply', 10),

  ('median',
   'Explain why the median can be preferable to the mean for skewed data.',
   'analyse', 20),

  ('variance',
   'Calculate sample variance from numerical observations.',
   'apply', 10),

  ('variance',
   'Explain why variance is measured in squared units.',
   'understand', 20),

  ('standard-deviation',
   'Calculate and interpret the sample standard deviation.',
   'apply', 10),

  ('standard-deviation',
   'Relate standard deviation to the typical spread of observations around their mean.',
   'understand', 20),

  ('interquartile-range',
   'Calculate the interquartile range from quartiles.',
   'apply', 10),

  ('interquartile-range',
   'Explain why the interquartile range is relatively resistant to extreme observations.',
   'understand', 20),

  ('skewness',
   'Recognise positively skewed, negatively skewed and approximately symmetric distributions.',
   'understand', 10),

  ('skewness',
   'Relate distribution skewness to the relative behaviour of the mean and median.',
   'analyse', 20),

  ('outliers',
   'Identify observations that may reasonably be considered unusual or influential.',
   'apply', 10),

  ('outliers',
   'Evaluate whether an extreme value should be investigated rather than automatically removed.',
   'evaluate', 20)
)

insert into public.academic_learning_objectives (
  concept_id,
  objective,
  objective_type,
  sort_order
)
select
  c.id,
  o.objective,
  o.objective_type,
  o.sort_order
from objectives o
join concept_lookup c
  on c.slug = o.concept_slug
on conflict (concept_id, objective)
do update set
  objective_type = excluded.objective_type,
  sort_order = excluded.sort_order,
  updated_at = now();


-- ============================================================
-- EXPLANATIONS
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
content(concept_slug, block_type, title, body, sort_order) as (
  values

  (
    'data-types',
    'explanation',
    'Understanding data types',
    'A variable records a characteristic that can differ between observations. Categorical variables describe membership in groups or categories, whereas numerical variables represent quantities for which arithmetic has meaningful interpretation. Numerical variables may be discrete, taking countable values such as number of hospital visits, or continuous, taking values across an interval such as height or blood pressure.',
    10
  ),

  (
    'data-types',
    'misconception',
    'Numbers do not always imply numerical data',
    'A variable may be stored using numbers without being quantitatively numerical. For example, codes such as 1 = male, 2 = female and 3 = another category are category labels. Calculating their arithmetic mean would not have a meaningful interpretation.',
    20
  ),

  (
    'levels-of-measurement',
    'explanation',
    'Levels of measurement',
    'Nominal variables represent categories without an inherent ordering. Ordinal variables have a meaningful ordering but differences between levels are not necessarily equal. Interval measurements have meaningful and equal differences but no meaningful absolute zero. Ratio measurements have equal intervals and a meaningful zero, allowing statements involving ratios.',
    10
  ),

  (
    'population-sample',
    'explanation',
    'Population and sample',
    'The population is the complete collection of individuals, units or measurements about which a scientific question is being asked. A sample is the subset actually observed. Statistical inference uses information from the sample to learn about characteristics of the wider population.',
    10
  ),

  (
    'population-sample',
    'worked_example',
    'University sleep study',
    'Suppose researchers want to estimate average nightly sleep among all undergraduate students at a university. All undergraduate students form the target population. If 500 students are selected and provide sleep measurements, those 500 students form the sample used for statistical analysis.',
    20
  ),

  (
    'parameter-statistic',
    'explanation',
    'Parameter and statistic',
    'A parameter is a numerical characteristic of a population, such as the population mean or population proportion. A statistic is calculated from sample data, such as the sample mean or sample proportion. Statistics are commonly used as estimators of unknown population parameters.',
    10
  ),

  (
    'parameter-statistic',
    'misconception',
    'Statistics vary from sample to sample',
    'A population parameter is treated as fixed for a defined population, even when its value is unknown. A sample statistic is random before data are collected because different random samples can produce different numerical values.',
    20
  ),

  (
    'confounding',
    'explanation',
    'What confounding means',
    'Confounding occurs when an observed association between an exposure and an outcome is mixed with the effect of another variable related to both. The resulting crude association may therefore differ from the association that would be observed after appropriately accounting for the confounding variable.',
    10
  ),

  (
    'confounding',
    'worked_example',
    'Coffee and cardiovascular disease',
    'Suppose coffee consumption appears associated with cardiovascular disease, but people who drink more coffee are also more likely to smoke. If smoking independently increases cardiovascular risk, smoking may confound the observed association between coffee and cardiovascular disease.',
    20
  ),

  (
    'bias',
    'explanation',
    'Systematic error',
    'Bias refers to systematic error that causes an estimate or conclusion to depart from the target value. Unlike random sampling variability, bias does not necessarily disappear simply by increasing sample size. Bias can arise through participant selection, measurement processes, missing information, analysis choices or other features of study design.',
    10
  ),

  (
    'bias',
    'misconception',
    'Larger samples do not automatically eliminate bias',
    'Increasing sample size generally reduces random sampling uncertainty, but a very large systematically biased sample can still provide a very precise estimate of the wrong quantity.',
    20
  ),

  (
    'arithmetic-mean',
    'explanation',
    'Arithmetic mean',
    'For observations x1 through xn, the sample mean is the sum of all observations divided by the number of observations: x-bar = (1/n) times the sum of xi. The mean uses every observation and represents the balance point of the observed distribution.',
    10
  ),

  (
    'arithmetic-mean',
    'worked_example',
    'Calculating a mean',
    'For observations 4, 6, 7, 8 and 10, the total is 35 and n = 5. The sample mean is therefore 35 / 5 = 7.',
    20
  ),

  (
    'arithmetic-mean',
    'misconception',
    'The mean need not be an observed value',
    'The arithmetic mean summarises the centre of a dataset but does not have to equal one of the recorded observations. It can also be strongly influenced by unusually extreme values.',
    30
  ),

  (
    'median',
    'explanation',
    'Median',
    'The median is the middle value after observations are arranged in order. When the number of observations is even, it is commonly defined as the average of the two central observations. Because it depends primarily on order rather than the magnitude of every value, the median is relatively resistant to extreme observations.',
    10
  ),

  (
    'variance',
    'explanation',
    'Variance',
    'Variance measures the average squared distance of observations from their mean. For a sample, the conventional unbiased variance estimator is s-squared = sum of squared deviations from the sample mean divided by n minus 1. Squaring prevents positive and negative deviations from cancelling each other.',
    10
  ),

  (
    'variance',
    'misconception',
    'Variance is expressed in squared units',
    'If a variable is measured in centimetres, its variance is measured in square centimetres. This makes variance mathematically useful but sometimes less intuitive to interpret directly.',
    20
  ),

  (
    'standard-deviation',
    'explanation',
    'Standard deviation',
    'The standard deviation is the positive square root of the variance. It describes dispersion using the same units as the original variable, making it easier to interpret than variance. Larger standard deviation indicates greater spread around the mean.',
    10
  ),

  (
    'interquartile-range',
    'explanation',
    'Interquartile range',
    'The interquartile range is Q3 minus Q1. It measures the width of the middle fifty percent of the ordered observations. Because it ignores the most extreme quarter of observations at each end, it is considerably less sensitive to extreme values than the range or standard deviation.',
    10
  ),

  (
    'skewness',
    'explanation',
    'Skewness',
    'Skewness describes asymmetry in a distribution. A positively skewed distribution has a longer right tail, while a negatively skewed distribution has a longer left tail. Extreme values in the long tail can pull the arithmetic mean toward that tail.',
    10
  ),

  (
    'skewness',
    'worked_example',
    'Income distributions',
    'Personal income commonly has positive skew because most observations lie in a lower or middle range while a smaller number of individuals have extremely high incomes. In such data the mean is often greater than the median.',
    20
  ),

  (
    'outliers',
    'explanation',
    'Outliers require investigation',
    'An outlier is an observation unusually distant from the main body of the data. It may represent genuine variation, an unusual but important case, a measurement problem or a data-entry error. Statistical analysis should investigate the reason for an outlier rather than remove it automatically.',
    10
  ),

  (
    'outliers',
    'misconception',
    'Outlier does not mean error',
    'An extreme observation is not automatically incorrect. Removing valid extreme observations purely because they are inconvenient can introduce bias and conceal important features of the data.',
    20
  )
)

insert into public.academic_content_blocks (
  concept_id,
  block_type,
  title,
  body,
  sort_order,
  lifecycle_status,
  source_note
)
select
  c.id,
  x.block_type,
  x.title,
  x.body,
  x.sort_order,
  'draft',
  'MAT Statistics Foundations Content v0.1 — requires human academic review'
from content x
join concept_lookup c
  on c.slug = x.concept_slug
where not exists (
  select 1
  from public.academic_content_blocks existing
  where existing.concept_id = c.id
    and existing.block_type = x.block_type
    and coalesce(existing.title, '') = coalesce(x.title, '')
);


-- ============================================================
-- MIGRATION DOCUMENTATION
-- ============================================================

comment on table public.academic_content_blocks is
  'Reusable canonical academic teaching blocks. Content must pass MAT academic review before publication.';

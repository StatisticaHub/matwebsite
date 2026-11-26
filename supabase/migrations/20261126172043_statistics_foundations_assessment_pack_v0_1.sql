-- ============================================================
-- MAT Statistics Foundations Assessment Pack v0.1
--
-- 12 canonical questions covering:
-- data types, measurement levels, population/sample,
-- parameter/statistic, confounding, mean, median,
-- variance, standard deviation, IQR, skewness and outliers.
--
-- All questions remain DRAFT pending academic review.
-- ============================================================


-- ============================================================
-- 0. PRE-FLIGHT
-- ============================================================

do $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.academic_concepts
  where slug = any(array[
    'data-types',
    'levels-of-measurement',
    'population-sample',
    'parameter-statistic',
    'confounding',
    'arithmetic-mean',
    'median',
    'variance',
    'standard-deviation',
    'interquartile-range',
    'skewness',
    'outliers'
  ]);

  if v_count <> 12 then
    raise exception
      'Statistics Foundations assessment seed expected 12 canonical concepts but found %.',
      v_count;
  end if;
end
$$;


-- ============================================================
-- 1. QUESTIONS
-- ============================================================

insert into public.academic_questions (
  slug,
  title,
  prompt,
  question_type,
  difficulty,
  cognitive_level,
  estimated_minutes,
  marks,
  lifecycle_status,
  source_note
)
values
(
  'stats-foundations-data-types-001',
  'Identify a continuous variable',
  $$Which of the following is best treated as a continuous quantitative variable?$$,
  'multiple_choice',
  1,
  'understand',
  2,
  1,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-levels-measurement-001',
  'Identify an ordinal variable',
  $$A survey records satisfaction as: very dissatisfied, dissatisfied, neutral, satisfied, very satisfied. What is the most appropriate level of measurement?$$,
  'multiple_choice',
  1,
  'understand',
  2,
  1,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-population-sample-001',
  'Population and sample',
  $$A university wants to estimate the average weekly study time of all 12,000 enrolled students. It surveys 500 students selected from the enrolment register. Identify the population and the sample.$$,
  'short_answer',
  1,
  'understand',
  3,
  2,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-parameter-statistic-001',
  'Parameter or statistic',
  $$Researchers calculate the mean systolic blood pressure of 240 sampled patients. Which statement is correct?$$,
  'multiple_choice',
  1,
  'understand',
  2,
  1,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-confounding-001',
  'Recognising confounding',
  $$An observational study finds that people who drink more coffee have a lower risk of a particular disease. Coffee drinkers in the study are also substantially younger, and age is strongly related to disease risk. Explain why age may be a confounder in the observed coffee–disease association.$$,
  'interpretation',
  3,
  'analyse',
  5,
  3,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-arithmetic-mean-001',
  'Calculate the arithmetic mean',
  $$Calculate the arithmetic mean of the values 4, 7, 8 and 11.$$,
  'calculation',
  1,
  'apply',
  2,
  2,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-median-001',
  'Calculate the median',
  $$Find the median of the ordered values 3, 4, 4, 9 and 12.$$,
  'calculation',
  1,
  'apply',
  2,
  2,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-variance-001',
  'Calculate population variance',
  $$For the population values 2, 4 and 6, calculate the population variance. Give the exact value and an approximate decimal value.$$,
  'calculation',
  2,
  'apply',
  4,
  3,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-standard-deviation-001',
  'Variance to standard deviation',
  $$A dataset has variance 9 square units. What is its standard deviation?$$,
  'numeric',
  1,
  'apply',
  2,
  1,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-iqr-001',
  'Calculate the interquartile range',
  $$A dataset has first quartile Q1 = 12 and third quartile Q3 = 20. Calculate the interquartile range.$$,
  'calculation',
  1,
  'apply',
  2,
  1,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-skewness-001',
  'Interpret positive skewness',
  $$A distribution has a long right-hand tail and its mean is greater than its median. What does this suggest about the shape of the distribution?$$,
  'interpretation',
  2,
  'analyse',
  3,
  2,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
),
(
  'stats-foundations-outliers-001',
  'Effect of an extreme value',
  $$A dataset contains one extremely large observation compared with all other values. Explain how this observation is likely to affect the mean and the median, and state which measure is usually more resistant to such an outlier.$$,
  'interpretation',
  2,
  'analyse',
  4,
  3,
  'draft',
  'MAT Statistics Foundations Assessment Pack v0.1 — requires human academic review'
)
on conflict (slug) do nothing;


-- ============================================================
-- 2. PRIMARY CONCEPT MAPPINGS
-- ============================================================

with mappings(question_slug, concept_slug) as (
  values
    ('stats-foundations-data-types-001', 'data-types'),
    ('stats-foundations-levels-measurement-001', 'levels-of-measurement'),
    ('stats-foundations-population-sample-001', 'population-sample'),
    ('stats-foundations-parameter-statistic-001', 'parameter-statistic'),
    ('stats-foundations-confounding-001', 'confounding'),
    ('stats-foundations-arithmetic-mean-001', 'arithmetic-mean'),
    ('stats-foundations-median-001', 'median'),
    ('stats-foundations-variance-001', 'variance'),
    ('stats-foundations-standard-deviation-001', 'standard-deviation'),
    ('stats-foundations-iqr-001', 'interquartile-range'),
    ('stats-foundations-skewness-001', 'skewness'),
    ('stats-foundations-outliers-001', 'outliers')
)
insert into public.academic_question_concepts (
  question_id,
  concept_id,
  is_primary,
  sort_order
)
select
  q.id,
  c.id,
  true,
  0
from mappings m
join public.academic_questions q
  on q.slug = m.question_slug
join public.academic_concepts c
  on c.slug = m.concept_slug
on conflict (question_id, concept_id) do nothing;


-- ============================================================
-- 3. LEARNING OBJECTIVE MAPPINGS
--
-- Prefer the intended cognitive/objective type.
-- If that concept does not have that exact objective type,
-- fall back to its first available canonical objective.
-- ============================================================

with mappings(
  question_slug,
  concept_slug,
  preferred_objective_type
) as (
  values
    ('stats-foundations-data-types-001', 'data-types', 'understand'),
    ('stats-foundations-levels-measurement-001', 'levels-of-measurement', 'understand'),
    ('stats-foundations-population-sample-001', 'population-sample', 'understand'),
    ('stats-foundations-parameter-statistic-001', 'parameter-statistic', 'understand'),
    ('stats-foundations-confounding-001', 'confounding', 'analyse'),
    ('stats-foundations-arithmetic-mean-001', 'arithmetic-mean', 'apply'),
    ('stats-foundations-median-001', 'median', 'apply'),
    ('stats-foundations-variance-001', 'variance', 'apply'),
    ('stats-foundations-standard-deviation-001', 'standard-deviation', 'apply'),
    ('stats-foundations-iqr-001', 'interquartile-range', 'apply'),
    ('stats-foundations-skewness-001', 'skewness', 'analyse'),
    ('stats-foundations-outliers-001', 'outliers', 'analyse')
)
insert into public.academic_question_objectives (
  question_id,
  learning_objective_id
)
select
  q.id,
  objective.id
from mappings m
join public.academic_questions q
  on q.slug = m.question_slug
join public.academic_concepts c
  on c.slug = m.concept_slug
cross join lateral (
  select alo.id
  from public.academic_learning_objectives alo
  where alo.concept_id = c.id
  order by
    case
      when alo.objective_type = m.preferred_objective_type
        then 0
      else 1
    end,
    alo.objective
  limit 1
) objective
on conflict (question_id, learning_objective_id) do nothing;


-- ============================================================
-- 4. ANSWER OPTIONS
-- ============================================================

with options(question_slug, option_key, option_text, is_correct, explanation, sort_order) as (
  values
    (
      'stats-foundations-data-types-001',
      'A',
      'Body temperature measured in degrees Celsius',
      true,
      'Temperature is quantitative and can vary continuously over a range.',
      1
    ),
    (
      'stats-foundations-data-types-001',
      'B',
      'Blood group',
      false,
      'Blood group is categorical rather than continuous.',
      2
    ),
    (
      'stats-foundations-data-types-001',
      'C',
      'Number of hospital admissions',
      false,
      'A count is quantitative but discrete.',
      3
    ),
    (
      'stats-foundations-data-types-001',
      'D',
      'Marital status',
      false,
      'Marital status is categorical.',
      4
    ),

    (
      'stats-foundations-levels-measurement-001',
      'A',
      'Nominal',
      false,
      'The categories have a meaningful order, so nominal is insufficient.',
      1
    ),
    (
      'stats-foundations-levels-measurement-001',
      'B',
      'Ordinal',
      true,
      'The response categories have a natural ranking but the spacing between categories is not assumed equal.',
      2
    ),
    (
      'stats-foundations-levels-measurement-001',
      'C',
      'Interval',
      false,
      'Equal numerical spacing between categories is not established.',
      3
    ),
    (
      'stats-foundations-levels-measurement-001',
      'D',
      'Ratio',
      false,
      'There is no meaningful numerical zero or ratio interpretation.',
      4
    ),

    (
      'stats-foundations-parameter-statistic-001',
      'A',
      'The sample mean is a population parameter.',
      false,
      'A parameter describes the population rather than the observed sample.',
      1
    ),
    (
      'stats-foundations-parameter-statistic-001',
      'B',
      'The sample mean is a statistic that can be used to estimate the population mean.',
      true,
      'A numerical summary calculated from the sample is a statistic.',
      2
    ),
    (
      'stats-foundations-parameter-statistic-001',
      'C',
      'The population mean is a statistic because it is numerical.',
      false,
      'The population mean is a parameter.',
      3
    ),
    (
      'stats-foundations-parameter-statistic-001',
      'D',
      'Neither the sample mean nor population mean can be used in statistical inference.',
      false,
      'Sample statistics are routinely used to estimate population parameters.',
      4
    )
)
insert into public.academic_question_options (
  question_id,
  option_key,
  option_text,
  is_correct,
  explanation,
  sort_order
)
select
  q.id,
  o.option_key,
  o.option_text,
  o.is_correct,
  o.explanation,
  o.sort_order
from options o
join public.academic_questions q
  on q.slug = o.question_slug
on conflict (question_id, option_key) do nothing;


-- ============================================================
-- 5. PROGRESSIVE HINTS
-- ============================================================

with hints(question_slug, hint_text, hint_level, sort_order) as (
  values
    (
      'stats-foundations-data-types-001',
      'Ask whether the variable can, in principle, take any value within an interval rather than only separate count values or categories.',
      1,
      1
    ),
    (
      'stats-foundations-levels-measurement-001',
      'Look for whether the categories have a meaningful ranking.',
      1,
      1
    ),
    (
      'stats-foundations-population-sample-001',
      'The population is the full group the research question concerns; the sample is the subset actually observed.',
      1,
      1
    ),
    (
      'stats-foundations-parameter-statistic-001',
      'Ask whether the quantity describes the full population or was calculated from the observed sample.',
      1,
      1
    ),
    (
      'stats-foundations-confounding-001',
      'A confounder is associated with the exposure and also related to the outcome, creating an alternative explanation for an observed association.',
      1,
      1
    ),
    (
      'stats-foundations-arithmetic-mean-001',
      'Add all observations and divide by the number of observations.',
      1,
      1
    ),
    (
      'stats-foundations-median-001',
      'Because there are five ordered observations, identify the middle position.',
      1,
      1
    ),
    (
      'stats-foundations-variance-001',
      'First calculate the population mean, then average the squared deviations from that mean.',
      1,
      1
    ),
    (
      'stats-foundations-standard-deviation-001',
      'Standard deviation is the positive square root of variance.',
      1,
      1
    ),
    (
      'stats-foundations-iqr-001',
      'Use IQR = Q3 - Q1.',
      1,
      1
    ),
    (
      'stats-foundations-skewness-001',
      'A long tail determines the direction of skewness.',
      1,
      1
    ),
    (
      'stats-foundations-outliers-001',
      'Compare how strongly an extreme numerical value enters the arithmetic mean versus how the median depends mainly on ordered position.',
      1,
      1
    )
)
insert into public.academic_question_hints (
  question_id,
  hint_text,
  hint_level,
  sort_order
)
select
  q.id,
  h.hint_text,
  h.hint_level,
  h.sort_order
from hints h
join public.academic_questions q
  on q.slug = h.question_slug
on conflict (question_id, sort_order) do nothing;


-- ============================================================
-- 6. WORKED SOLUTIONS
-- ============================================================

with solutions(
  question_slug,
  final_answer,
  solution_text,
  marking_guidance,
  common_errors
) as (
  values
    (
      'stats-foundations-data-types-001',
      'A — Body temperature measured in degrees Celsius',
      $$Body temperature is quantitative and is normally treated as continuous because values can vary over a continuum within a plausible range. Blood group and marital status are categorical. Number of hospital admissions is a count and is therefore discrete.$$,
      'Award credit for identifying option A and distinguishing continuous measurement from categorical variables and counts.',
      'Treating every numerical variable as continuous; confusing discrete counts with continuous measurements.'
    ),
    (
      'stats-foundations-levels-measurement-001',
      'Ordinal',
      $$The satisfaction categories have a natural order from very dissatisfied to very satisfied. However, the distance between adjacent categories is not known to be equal. The variable is therefore ordinal.$$,
      'Award full credit for ordinal with a correct explanation based on ordering without assumed equal spacing.',
      'Calling the scale nominal because the responses are categories; treating category labels as equally spaced interval measurements without justification.'
    ),
    (
      'stats-foundations-population-sample-001',
      'Population: all 12,000 enrolled students. Sample: the 500 surveyed students.',
      $$The research target is the weekly study time of all enrolled students, so the population is the full set of 12,000 enrolled students. The 500 students whose data are actually collected form the sample.$$,
      'One mark for the population and one mark for the sample.',
      'Calling the 500 students the population because they are the observed data.'
    ),
    (
      'stats-foundations-parameter-statistic-001',
      'B — The sample mean is a statistic that can estimate the population mean.',
      $$The mean calculated from the 240 sampled patients is a statistic because it is calculated from observed sample data. The corresponding mean for the full target population would be a parameter. Sample statistics can be used to estimate population parameters.$$,
      'Award full credit for option B and a correct sample-versus-population distinction.',
      'Using parameter and statistic interchangeably.'
    ),
    (
      'stats-foundations-confounding-001',
      'Age may confound the observed association.',
      $$Age differs between coffee-exposure groups and is also related to disease risk. Therefore part or all of the apparent association between coffee consumption and disease could reflect the age difference rather than an effect of coffee itself. Age is therefore a plausible confounder that should be considered in the design or analysis.$$,
      'Credit should identify both components: age is associated with coffee consumption in the study and age is related to disease risk.',
      'Calling every associated variable a confounder without explaining its relationship to both exposure and outcome; claiming adjustment automatically proves causality.'
    ),
    (
      'stats-foundations-arithmetic-mean-001',
      '7.5',
      $$The total is 4 + 7 + 8 + 11 = 30. There are 4 observations. Therefore the arithmetic mean is 30 / 4 = 7.5.$$,
      'One mark for the correct total/divisor and one mark for the final mean.',
      'Dividing by the wrong number of observations; reporting the sum rather than the mean.'
    ),
    (
      'stats-foundations-median-001',
      '4',
      $$The values are already ordered: 3, 4, 4, 9, 12. With five observations, the median is the third observation. Therefore the median is 4.$$,
      'Full credit for identifying the middle ordered observation as 4.',
      'Averaging two values despite the number of observations being odd.'
    ),
    (
      'stats-foundations-variance-001',
      '8/3 ≈ 2.67',
      $$The population mean is (2 + 4 + 6) / 3 = 4. The squared deviations are (2 - 4)^2 = 4, (4 - 4)^2 = 0 and (6 - 4)^2 = 4. Their sum is 8. Because these are the complete population values, divide by 3: variance = 8/3 ≈ 2.67.$$,
      'Credit the mean, squared deviations and use of the population divisor 3.',
      'Using the sample divisor n - 1 even though the question explicitly specifies a population; forgetting to square deviations.'
    ),
    (
      'stats-foundations-standard-deviation-001',
      '3',
      $$Standard deviation is the positive square root of variance. Therefore sqrt(9) = 3.$$,
      'Full credit for 3 with correct units if units are supplied in context.',
      'Reporting 9; forgetting that standard deviation returns to the original measurement units.'
    ),
    (
      'stats-foundations-iqr-001',
      '8',
      $$The interquartile range is Q3 - Q1. Therefore IQR = 20 - 12 = 8.$$,
      'Full credit for 8.',
      'Adding the quartiles instead of subtracting Q1 from Q3.'
    ),
    (
      'stats-foundations-skewness-001',
      'The distribution is positively (right) skewed.',
      $$A long right-hand tail indicates positive or right skewness. Large observations in the right tail tend to pull the mean upward, so the mean being greater than the median is also consistent with positive skewness.$$,
      'Credit positive/right skewness and reasoning based on the long right tail.',
      'Describing the distribution as left-skewed because most observations lie toward the left.'
    ),
    (
      'stats-foundations-outliers-001',
      'The mean is usually affected more strongly; the median is more resistant.',
      $$An extremely large observation contributes directly to the total used in the arithmetic mean, so it can pull the mean upward substantially. The median depends primarily on the ordered middle position and therefore usually changes much less. The median is consequently more resistant to extreme outliers.$$,
      'Credit the stronger effect on the mean, relative stability of the median and identification of the median as more resistant.',
      'Claiming that an outlier can never change the median; saying the mean is resistant because all observations are included.'
    )
)
insert into public.academic_question_solutions (
  question_id,
  final_answer,
  solution_text,
  marking_guidance,
  common_errors
)
select
  q.id,
  s.final_answer,
  s.solution_text,
  s.marking_guidance,
  s.common_errors
from solutions s
join public.academic_questions q
  on q.slug = s.question_slug
on conflict (question_id) do nothing;


-- ============================================================
-- 7. POST-SEED VALIDATION
-- ============================================================

do $$
declare
  v_questions integer;
  v_concepts integer;
  v_objectives integer;
  v_hints integer;
  v_solutions integer;
begin
  select count(*)
  into v_questions
  from public.academic_questions
  where slug like 'stats-foundations-%-001';

  select count(*)
  into v_concepts
  from public.academic_question_concepts aqc
  join public.academic_questions q
    on q.id = aqc.question_id
  where q.slug like 'stats-foundations-%-001';

  select count(*)
  into v_objectives
  from public.academic_question_objectives aqo
  join public.academic_questions q
    on q.id = aqo.question_id
  where q.slug like 'stats-foundations-%-001';

  select count(*)
  into v_hints
  from public.academic_question_hints h
  join public.academic_questions q
    on q.id = h.question_id
  where q.slug like 'stats-foundations-%-001';

  select count(*)
  into v_solutions
  from public.academic_question_solutions s
  join public.academic_questions q
    on q.id = s.question_id
  where q.slug like 'stats-foundations-%-001';

  if v_questions <> 12
     or v_concepts <> 12
     or v_objectives <> 12
     or v_hints <> 12
     or v_solutions <> 12 then

    raise exception
      'Assessment seed validation failed: questions %, concepts %, objectives %, hints %, solutions %',
      v_questions,
      v_concepts,
      v_objectives,
      v_hints,
      v_solutions;
  end if;
end
$$;

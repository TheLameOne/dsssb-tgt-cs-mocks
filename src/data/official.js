// Facts taken directly from DSSSB's own documents. Checked on 7 November 2026.

export const CHECKED_ON = '7 November 2026';

export const OFFICIAL_LINKS = {
  site: 'https://dsssb.delhi.gov.in/',
  advertisement: 'https://dsssb.delhi.gov.in/sites/default/files/DSSSB/circulars-orders/final_advt-03-2026_1.pdf',
  schedule: 'https://dsssb.delhi.gov.in/sites/default/files/DSSSB/circulars-orders/exam_schedule_1.pdf',
  syllabus: 'https://dsssb.delhi.gov.in/sites/default/files/DSSSB/universal-tab/pc-41-26_tgt_computer_science_in_doe.pdf',
  scheme: 'https://dsssb.delhi.gov.in/sites/default/files/DSSSB/universal-tab/syllabus_i-t-t_one_tier_technical_i_teaching_200_marks.pdf',
  previousSyllabus: 'https://dsssb.delhi.gov.in/sites/default/files/DSSSB/universal-tab/pc_56-24.pdf',
  ndmcSyllabus: 'https://dsssb.delhi.gov.in/sites/default/files/DSSSB/universal-tab/tgt_computer_science_in_ndmc.pdf',
  questionBank: 'https://dsssb.delhi.gov.in/doit/tab-content/question-bank-online-exam-2023',
};

// Numbering follows the official list for Post Code 41/26.
export const SYLLABUS = [
  'Mathematics I, II, III, IV',
  'Business Communication, Business Organization and Management, Writing',
  'Computer Basics and P.C. Software',
  'Programming with C, Data Structures using C, C++ Programming',
  'Fundamentals of Information Technology',
  'Basis of Physics',
  'Digital Electronics',
  'Database Management System',
  'Computer Architecture',
  'Front End Designed Tools',
  'Financial Accounting',
  'Object/Computer Oriented Programming, Numerical Techniques',
  'Software Engineering',
  'Java Programming and website design',
  'Operating Systems',
  'Business Economics',
  'Computer Networks',
  '.net programming',
  'Linux Environment',
  'E-Commerce',
  'Design and analysis of algorithms',
  'Computer Network Security',
  'Management Information System',
  'Mobile Computing',
  'Computer Graphics and Multimedia Applications: graphics, graphics hardware, clipping, curves and surfaces, solid modelling',
  'Internet Programming: web server, CSS, event model, filters and transitions, data binding with tabular data control, PWS setup, publishing with Internet Information Server, DTDs, XML with XHTML and CSS, XML parsers',
  'Knowledge Management and New Economy',
  'Foundation Course in English',
  'Problem Solving and Programming',
  'Statistical Techniques: descriptive statistics, probability concepts, probability distributions, inference',
  'TCP/Protocols',
  'Interpolation',
];

export const METHODOLOGY = [
  'Learning and teaching',
  'Language across the curriculum',
  'Understanding discipline and subject',
  'Gender, school and society',
  'Pedagogy of a school subject',
  'Knowledge and curriculum',
  'Assessment for learning',
  'Creating an inclusive school',
  'Childhood and growing up',
  'Drama and art in education',
];

export const SHIFTS = [
  { date: '27 Nov 2026', shifts: 'All three' },
  { date: '28 Nov 2026', shifts: 'Shift 1' },
  { date: '30 Nov 2026', shifts: 'All three' },
  { date: '1 Dec 2026', shifts: 'All three' },
  { date: '2 Dec 2026', shifts: 'All three' },
  { date: '3 Dec 2026', shifts: 'Shifts 2 and 3' },
  { date: '4 Dec 2026', shifts: 'All three' },
];

const dsssb = 'https://dsssb.delhi.gov.in/sites/default/files/DSSSB/universal-tab';
const adda = 'https://www.adda247.com/jobs/wp-content/uploads/sites/13/2026/06';

export const PAST_PAPERS = [
  {
    cycle: '2026',
    post: '41/26',
    department: 'Directorate of Education',
    dates: '27 Nov to 4 Dec 2026',
    note: 'Your exam. Papers appear after the exam, if DSSSB publishes them.',
    papers: [],
  },
  {
    cycle: '2025',
    post: '56/24',
    department: 'Directorate of Education',
    dates: '12 and 13 Sep 2025 (dates from a coaching site that reproduces the schedule)',
    note: 'The closest match to your exam, because the syllabus is identical. No copy found: DSSSB\'s Question Bank 2025 page was empty when checked, and I found no memory-based paper.',
    papers: [],
  },
  {
    cycle: '2024',
    post: '70/23 (inferred)',
    department: 'NDMC',
    dates: '7 Feb 2024',
    note: 'Follows the separate NDMC syllabus: Python, cyber ethics and IPR rather than the 32-topic list. Good for Section A practice, misleading for Section B. The post code is inferred from the paper\'s content, because the paper does not print one.',
    papers: [
      { label: 'Shift 2, English', url: `${adda}/02154459/DSSSB-TGT-Computer-Science-Official-Paper-Held-On_-07-Feb-2024-Shift-2-Eng.pdf`, source: 'Adda247 copy' },
      { label: 'Shift 2, Hindi', url: `${adda}/02154454/DSSSB-TGT-Computer-Science-Official-Paper-Held-On_-07-Feb-2024-Shift-2-Hindi.pdf`, source: 'Adda247 copy' },
    ],
  },
  {
    cycle: '2023',
    post: '39/22',
    department: 'Directorate of Education',
    dates: '24 and 25 Jun 2023',
    note: 'Same 32-topic list. Best guide to the current style. 90 Computer Science and 10 Teaching Methodology questions.',
    papers: [
      { label: '24 Jun, shift 2, with answer key', url: `${dsssb}/tgtcomputerscience_24th_jun_2023_shift_2.pdf`, source: 'DSSSB', official: true },
      { label: '24 Jun, shift 3, English', url: `${adda}/02154446/DSSSB-TGT-Computer-Science-Official-Paper-Held-On_-24-June-2023-Shift-3-Eng.pdf`, source: 'Adda247 copy' },
      { label: '24 Jun, shift 3, Hindi', url: `${adda}/02154456/DSSSB-TGT-Computer-Science-Official-Paper-Held-On_-24-June-2023-Shift-3-Hindi.pdf`, source: 'Adda247 copy' },
      { label: '25 Jun, shift 1, English', url: `${adda}/02154447/DSSSB-TGT-CS-Official-Paper-Held-On_-25-June-2023-Shift-1-English.pdf`, source: 'Adda247 copy' },
      { label: '25 Jun, shift 2, English', url: `${adda}/02154449/DSSSB-TGT-CS-Official-Paper-Held-On_-25-June-2023-Shift-2-English.pdf`, source: 'Adda247 copy' },
    ],
  },
  {
    cycle: '2021',
    post: '91/20',
    department: 'Directorate of Education',
    dates: '1, 7 and 8 Aug 2021',
    note: 'Five official papers with keys. They sweep almost all of the 32 topics, and the last ten questions are already Teaching Methodology.',
    papers: [
      { label: 'Paper 1 (1 Aug)', url: `${dsssb}/tgt_computer_science1.pdf`, source: 'DSSSB', official: true },
      { label: 'Paper 2 (1 Aug)', url: `${dsssb}/tgt_computer_science2.pdf`, source: 'DSSSB', official: true },
      { label: 'Paper 3 (7 Aug)', url: `${dsssb}/tgt_computer_science3.pdf`, source: 'DSSSB', official: true },
      { label: 'Paper 4 (7 Aug)', url: `${dsssb}/tgt_computer_science4.pdf`, source: 'DSSSB', official: true },
      { label: 'Paper 5 (8 Aug)', url: `${dsssb}/tgt_computer_science5.pdf`, source: 'DSSSB', official: true },
    ],
  },
  {
    cycle: '2017',
    post: '192/14',
    department: 'Directorate of Education',
    dates: '21 May 2017',
    note: 'The oldest paper in the last ten years. A flat 100 subject questions with no separate methodology part, and heavy on C, Linux and networks.',
    papers: [
      { label: 'Bilingual scan', url: `${adda}/02154458/DSSSB-TGT-Computer-Science-Official-Paper-Held-On_-21-May-2017.pdf`, source: 'Adda247 copy' },
    ],
  },
];

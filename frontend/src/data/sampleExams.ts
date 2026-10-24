export interface SampleExam {
  id: string;
  title: string;
  course: string;
  domain: string;
  rawText: string;
}

export const SAMPLE_EXAMS: Record<"cs" | "bio" | "law", SampleExam> = {
  cs: {
    id: "cs",
    title: "CS 101: Introduction to Programming — Midterm",
    course: "CS 101",
    domain: "Computer Science",
    rawText: `CS 101: Introduction to Programming — Midterm Examination
Time Allowed: 60 Minutes | Total Marks: 50

PART I: MULTIPLE CHOICE QUESTIONS

1. Which of the following identifier names is valid according to standard programming language rules?
A) 2ndVariable
B) user_total_score
C) class
D) total-amount

2. In an if-else conditional selection construct, which scenario accurately describes program execution flow?
A) Both branches execute sequentially during each evaluation
B) Neither branch can execute regardless of condition validity
C) The if-block executes only when the boolean condition evaluates to true, otherwise the else-block executes
D) Only the else-block executes in all program runs

3. What occurs when a loop counter variable fails to advance toward the loop termination condition?
A) A compile-time syntax error occurs immediately
B) An infinite loop occurs during program execution
C) The loop terminates prematurely on iteration zero
D) The operating system restarts automatically

4. What is the primary purpose of a function's return statement?
A) To terminate execution and send a value back to the caller
B) To allocate global memory identifiers across files
C) To pause program execution until keyboard input is entered
D) To duplicate the function body across multiple classes

5. In a zero-indexed array containing 8 elements, what is the valid index of the final element?
A) 0
B) 7
C) 8
D) 9

6. In arithmetic expressions, how does the prefix increment operator (++x) differ from the postfix increment operator (x++)?
A) Prefix increments the value before expression evaluation, while postfix increments after evaluation
B) Prefix decreases the variable while postfix increases the variable
C) Prefix works only with floating-point variables while postfix works with integers
D) There is no functional difference between prefix and postfix operators

7. Where can a local variable declared inside a function block be accessed?
A) Anywhere throughout all source files in the application
B) Only within the specific function where it is defined
C) By any running background process in the system
D) Nowhere because local variables are never allocated in RAM

8. Which statement best characterizes an immutable data structure?
A) Its elements can be modified at any point during runtime
B) Its contents cannot be altered once created
C) It automatically converts all numerical values into text
D) It requires manual destruction by the user CPU

PART II: TRUE OR FALSE QUESTIONS

9. A program can contain multiple nested if-statements within a single function body.

10. A variable declared as an integer can always store floating-point decimal numbers without precision loss.

11. Recursive functions never terminate because every function call consumes infinite call stack memory.

12. A while loop evaluates its boolean condition before executing the loop body statements.

Answer Key:
1. B
2. C
3. B
4. A
5. B
6. A
7. B
8. B
9. True
10. False
11. False
12. True`,
  },

  bio: {
    id: "bio",
    title: "BIO 204: Cellular Biology & Physiology — Midterm",
    course: "BIO 204",
    domain: "Life Sciences",
    rawText: `BIO 204: Cellular Biology & Physiology — Midterm Examination
Time Allowed: 45 Minutes | Total Marks: 40

PART I: MULTIPLE CHOICE QUESTIONS

1. Which organelle serves as the primary site of aerobic ATP synthesis in eukaryotic cells?
A) Ribosome
B) Mitochondrion
C) Golgi apparatus
D) Endoplasmic reticulum

2. How does facilitated diffusion differ from active transport across plasma membranes?
A) Facilitated diffusion requires direct ATP hydrolysis, whereas active transport relies on thermal motion
B) Facilitated diffusion operates exclusively against chemical concentration gradients
C) Facilitated diffusion moves solutes along electrochemical gradients without direct metabolic energy consumption
D) Active transport cannot utilize transmembrane protein carriers

3. During anaphase of mitosis, which cellular event occurs?
A) Nuclear envelope reforms around daughter chromosomes
B) Chromatin condenses into visible homologous pairs
C) Sister chromatids separate and migrate toward opposite spindle poles
D) DNA replication initiates at replication forks

4. Which biomolecule acts as the principal structural component of biological membranes?
A) Triglyceride
B) Phospholipid
C) Glycogen
D) Cholesterol ester

PART II: TRUE OR FALSE QUESTIONS

5. Ribosomes are surrounded by a double phospholipid bilayer membrane within the cytoplasm. [ ] True [ ] False

6. Glycolysis can proceed in the cytosol under anaerobic conditions in the absence of oxygen. [ ] True [ ] False

7. Enzymes decrease the overall free energy change (delta G) of spontaneous biochemical reactions. (True/False)

8. Osmosis describes the net diffusion of water across a semipermeable membrane from low solute to high solute concentration. (T/F)

Answer Key:
1. B
2. C
3. C
4. B
5. False
6. True
7. False
8. True`,
  },

  law: {
    id: "law",
    title: "LAW 310: Legal Ethics & Statutory Interpretation — Examination",
    course: "LAW 310",
    domain: "Jurisprudence",
    rawText: `LAW 310: Legal Ethics & Statutory Interpretation — Examination
Time Allowed: 60 Minutes | Total Marks: 50

PART I: MULTIPLE CHOICE QUESTIONS

1. Under the Model Rules of Professional Conduct, when may a lawyer reveal confidential client information?
A) Under no circumstances, as attorney-client confidentiality is an absolute constitutional prohibition
B) When the client gives informed consent, or when disclosure is reasonably necessary to prevent reasonably certain death or substantial bodily harm
C) Whenever the attorney disagrees with the client's commercial business strategy
D) Whenever opposing counsel serves an informal written request

2. Under the plain meaning canon of statutory construction, how should courts interpret unambiguous statutory text?
A) Courts must defer exclusively to legislative history committee reports
B) Courts apply the ordinary meaning of language unless it leads to an absurd result
C) Courts rewrite statutory provisions to align with contemporary social preferences
D) Statutes must be struck down under substantive due process

3. What ethical obligation governs an attorney who discovers prospective client perjury prior to testimony?
A) The attorney must actively encourage perjury to zealously advocate the client's interests
B) The attorney must withdraw immediately without attempting to persuade the client to testify truthfully
C) The attorney must seek to persuade the client not to offer false evidence, and refuse to offer it if persuasion fails
D) The attorney has no ethical duties regarding witness veracity in civil proceedings

4. Which scenario creates a concurrent conflict of interest requiring written informed consent?
A) Representing co-defendants with directly adverse defenses in criminal litigation
B) Representing two unrelated clients in separate transactional matters with adverse economic interests in different markets
C) The representation of one client will be directly adverse to another client in the same proceeding
D) Filing an amicus brief on an unrelated administrative question

PART II: TRUE OR FALSE QUESTIONS

5. An attorney may always represent conflicting adverse parties in the same litigation provided both sign verbal waivers. [ ] True [ ] False

6. The doctrine of stare decisis requires courts to adhere to relevant precedent established in binding appellate decisions. [ ] True [ ] False

7. Ex parte communications with a presiding judge regarding the merits of an active trial are strictly prohibited without notice to opposing counsel. (True/False)

8. Attorney work-product privilege terminates automatically upon the formal conclusion of the litigation matter. (T/F)

Answer Key:
1. B
2. B
3. C
4. C
5. False
6. True
7. True
8. False`,
  },
};

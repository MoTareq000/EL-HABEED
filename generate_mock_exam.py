import os
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

def create_mock_exam():
    pdf_filename = "CS101_Programming_Midterm_Exam.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=48,
        leftMargin=48,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ExamTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=1, # Center
        textColor=colors.HexColor("#14213D"),
    )

    subtitle_style = ParagraphStyle(
        "ExamSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor("#4A5368"),
    )

    meta_style = ParagraphStyle(
        "ExamMeta",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor("#14213D"),
    )

    section_header = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#C8372D"),
        spaceBefore=14,
        spaceAfter=6,
    )

    q_stem_style = ParagraphStyle(
        "QuestionStem",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#14213D"),
        spaceBefore=6,
        spaceAfter=3,
    )

    choice_style = ParagraphStyle(
        "ChoiceItem",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=12.5,
        leftIndent=14,
        textColor=colors.HexColor("#14213D"),
        spaceAfter=1.5,
    )

    key_style = ParagraphStyle(
        "KeyText",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#14213D"),
    )

    story = []

    # Header Box
    story.append(Paragraph("FACULTY OF COMPUTER SCIENCE & INFORMATION SYSTEMS", subtitle_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("CS 101: Introduction to Programming", title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("Midterm Examination — Spring Semester", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("TIME ALLOWED: 60 MINUTES  |  TOTAL MARKS: 50  |  CLOSED BOOK", meta_style))
    story.append(Spacer(1, 6))

    # Student Info Grid Table
    info_data = [
        ["Student Name: _______________________", "Student ID: _______________", "Section: _____"],
    ]
    t = Table(info_data, colWidths=[240, 180, 96])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#4A5368")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#14213D"), spaceBefore=2, spaceAfter=8))

    # Instructions
    instructions = (
        "<b>Instructions:</b> Read each question carefully. Select the single best answer for Multiple Choice "
        "questions and mark True or False for statements. Answer all questions."
    )
    story.append(Paragraph(instructions, subtitle_style))
    story.append(Spacer(1, 8))

    # SECTION I: MULTIPLE CHOICE
    story.append(Paragraph("PART I: MULTIPLE CHOICE QUESTIONS (32 MARKS)", section_header))
    story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#C8372D"), spaceBefore=0, spaceAfter=6))

    mcq_questions = [
        (
            "1. Which of the following identifier names is valid according to standard programming language rules?",
            [
                "A) 2ndVariable",
                "B) user_total_score",
                "C) class",
                "D) total-amount",
            ]
        ),
        (
            "2. In an if-else conditional selection construct, which scenario accurately describes program execution flow?",
            [
                "A) Both branches execute sequentially during each evaluation",
                "B) Neither branch can execute regardless of condition validity",
                "C) The if-block executes only when the boolean condition evaluates to true, otherwise the else-block executes",
                "D) Only the else-block executes in all program runs",
            ]
        ),
        (
            "3. What occurs when a loop counter variable fails to advance toward the loop termination condition?",
            [
                "A) A compile-time syntax error occurs immediately",
                "B) An infinite loop occurs during program execution",
                "C) The loop terminates prematurely on iteration zero",
                "D) The operating system restarts automatically",
            ]
        ),
        (
            "4. What is the primary purpose of a function's return statement?",
            [
                "A) To terminate execution and send a value back to the caller",
                "B) To allocate global memory identifiers across files",
                "C) To pause program execution until keyboard input is entered",
                "D) To duplicate the function body across multiple classes",
            ]
        ),
        (
            "5. In a zero-indexed array containing 8 elements, what is the valid index of the final element?",
            [
                "A) 0",
                "B) 7",
                "C) 8",
                "D) 9",
            ]
        ),
        (
            "6. In arithmetic expressions, how does the prefix increment operator (++x) differ from the postfix increment operator (x++)?",
            [
                "A) Prefix increments the value before expression evaluation, while postfix increments after evaluation",
                "B) Prefix decreases the variable while postfix increases the variable",
                "C) Prefix works only with floating-point variables while postfix works with integers",
                "D) There is no functional difference between prefix and postfix operators",
            ]
        ),
        (
            "7. Where can a local variable declared inside a function block be accessed?",
            [
                "A) Anywhere throughout all source files in the application",
                "B) Only within the specific function where it is defined",
                "C) By any running background process in the system",
                "D) Nowhere because local variables are never allocated in RAM",
            ]
        ),
        (
            "8. Which statement best characterizes an immutable data structure?",
            [
                "A) Its elements can be modified at any point during runtime",
                "B) Its contents cannot be altered once created",
                "C) It automatically converts all numerical values into text",
                "D) It requires manual destruction by the user CPU",
            ]
        ),
    ]

    for stem, choices in mcq_questions:
        q_elements = [Paragraph(stem, q_stem_style)]
        for c in choices:
            q_elements.append(Paragraph(c, choice_style))
        q_elements.append(Spacer(1, 4))
        story.append(KeepTogether(q_elements))

    # SECTION II: TRUE OR FALSE
    story.append(Spacer(1, 6))
    story.append(Paragraph("PART II: TRUE OR FALSE QUESTIONS (18 MARKS)", section_header))
    story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#C8372D"), spaceBefore=0, spaceAfter=6))

    tf_questions = [
        "9. A program can contain multiple nested if-statements within a single function body.",
        "10. A variable declared as an integer can always store floating-point decimal numbers without precision loss.",
        "11. Recursive functions never terminate because every function call consumes infinite call stack memory.",
        "12. A while loop evaluates its boolean condition before executing the loop body statements.",
    ]

    for stem in tf_questions:
        q_elements = [
            Paragraph(stem, q_stem_style),
            Spacer(1, 4),
        ]
        story.append(KeepTogether(q_elements))

    # Answer Key Section (for auto-grading validation)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#14213D"), spaceBefore=6, spaceAfter=8))
    
    key_elements = [
        Paragraph("<b>Answer Key:</b>", q_stem_style),
        Paragraph("1. B", key_style),
        Paragraph("2. C", key_style),
        Paragraph("3. B", key_style),
        Paragraph("4. A", key_style),
        Paragraph("5. B", key_style),
        Paragraph("6. A", key_style),
        Paragraph("7. B", key_style),
        Paragraph("8. B", key_style),
        Paragraph("9. True", key_style),
        Paragraph("10. False", key_style),
        Paragraph("11. False", key_style),
        Paragraph("12. True", key_style),
    ]
    story.append(KeepTogether(key_elements))

    doc.build(story)
    print(f"Generated {pdf_filename} successfully!")

    # Also copy to Downloads folder for easy user access
    downloads_dest = os.path.join(r"C:\Users\Access\Downloads", pdf_filename)
    shutil.copyfile(pdf_filename, downloads_dest)
    print(f"Copied to {downloads_dest}")

if __name__ == "__main__":
    create_mock_exam()

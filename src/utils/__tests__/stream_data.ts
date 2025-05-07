export const ganttString = `
\`\`\`mermaid
gantt
    title Compostable Packaging Material Project Timeline
    dateFormat YYYY-MM-DD
    %% MONTH 1: Material Research & Specification
    section Material Research & Specification
      Review existing compostable materials: t1, 2025-06-01, 7d
      Define material properties & requirements: t2, after t1, 5d
      Draft technical specification document: t3, after t2, 8d
      Technical specification document completed: milestone, after t3

    %% MONTH 2: Prototype Development & Initial Testing
    section Prototype Development
      Create initial prototypes for various food types: t4, after t3, 8d
      Refine prototypes based on findings: t5, after t12, 10d

    section Testing & Validation
      Conduct initial lab tests (degradation, safety, durability): t12, after t4, 10d
      Document initial test results: t13, after t12, 3d
      Successful lab test results (≤7 days): milestone, after t13

    %% MONTH 3: Prototype Refinement & Extended Testing
      Conduct extended lab testing: t14, after t5, 7d
      Document extended test results: t15, after t14, 4d
      Approved packaging prototypes (dry & wet foods): milestone, after t15

    %% MONTH 4: Design & Assessment
    section Design & Assessment
      Develop packaging design mockups (3 versions): t6, after t15, 8d
      Packaging design mockups finalized: milestone, after t6
      Perform environmental impact assessment: t7, after t6, 7d
      Environmental impact assessment report delivered: milestone, after t7

    %% MONTH 5: Compliance & User Pilot
    section Compliance & Regulatory
      Review FDA, EU, and other regulatory standards: t8, after t7, 8d
      Compile regulatory compliance checklist: t9, after t8, 7d
      Regulatory compliance checklist signed off: milestone, after t9

    section User Testing
      Organize pilot user test: t10, after t9, 7d

    %% MONTH 6: User Feedback & Closure
      Collect & summarize user feedback: t11, after t10, 8d
      User feedback summary delivered: milestone, after t11
      Final project documentation & closure: t16, after t11, 10d

\`\`\`
`;


export const ganttString3 = `
\`\`\`mermaid
gantt
    title Vertical Farming Pilot Project Timeline
    dateFormat YYYY-MM-DD

    section Site Analysis & Location Selection
        Research local urban sites: research, 2025-06-01, 7d
        Assess site constraints: assess, after research, 10d
        Prepare Site Analysis Report: prepare, after assess, 7d
        Completion of Site Analysis Report: milestone, after prepare

    section Modular System Design
        Develop initial concepts and 3D models: develop, 2025-06-05, 10d
        Engineer hydroponic/aeroponic modules: engineer, after develop, 10d
        Review with stakeholders: review, after engineer, 5d
        Finalize Modular Design Pack: finalize, after review, 5d
        Approval of Modular Design Pack: milestone, after finalize

    section Resource Efficiency Planning
        Analyze energy, water, nutrient needs: analyze, 2025-06-10, 5d
        Integrate sustainable resource solutions: integrate, after analyze, 5d
        Draft Resource Efficiency Plan: draft, after integrate, 5d
        Resource Efficiency Plan finalized: milestone, after draft

    section Prototype Fabrication & Installation
        Source materials and components: source, after milestone, 10d
        Assemble and install prototype: assemble, after source, 15d
        Conduct safety and compliance checks: compliance, after assemble, 5d
        Pilot Installation operational: milestone, after compliance

    section Operational Testing & Performance Measurement
        Plant initial crop cycles: plant, after milestone, 2d
        Monitor yield, resource use, and reliability: monitor, after plant, 88d
        Collect and analyze performance data: analyze_data, after monitor, 5d
        3-month crop yield data collected: milestone, after analyze_data

    section Documentation & Handover
        Compile Crop Yield and Performance Report: report, after milestone, 5d
        Create Maintenance and Operations Manual: manual, after report, 5d
        Final presentation to stakeholders: present, after manual, 3d
        Final deliverables submitted: milestone, after present
\`\`\`
`
export const createProjectPlanPrompt = `
      Once the project is ready, you should create a project plan. Here is how you do it:

      Relpy to the user letting them know that you have anough information and that you will create a project plan.

      In that response, you should also include the project plan. 

      The project plan should be between three backticks. (\`\`\`)
      You must follow the first three backticks with "ProjectPlan".

      Create initial consultation notes in Markdown format based on the conversation.
        
      Structure your plan using these specific sections:
      # Timescales
      Capture information about project duration, deadlines, milestones, and any timing constraints.

      # Scope
      Document what is included and excluded from the project, key deliverables, and any scope boundaries discussed.

      # Tasks
      List the tasks that need to be completed by the roles to deliver the project. Tend towards 2 levels, a set of high level tasks and a set of subtasks indented under each high level task that requires subtasks.

      # Milestones
      List the key milestones or events that need to be completed for the project.

      # Roles
      Note the key stakeholders, team members, and their responsibilities within the project.

      # Dependencies
      Record any external or internal dependencies that might impact the project timeline or success.

      # Deliverables
      List the specific outputs, products, or services that will be created during the project.

      Write in a concise, consultant-style note-taking format rather than a formal project plan. Use bullet points liberally for clarity. Focus on recording information as it emerges in the conversation rather than trying to create a comprehensive plan at this stage.

      If there is no information yet on a particular section, include the section heading with a brief placeholder like: "No information gathered yet."

      An example start of a project plan is:

      \`\`\`ProjectPlan
      # Timescales
      ...
      \`\`\`

      at the end of your message you should finish with [[CREATE_PROJECT_GANTT]]

      This will trigger the creation of a project gantt chart by another ai.

      `;

      export const exampleMermaidOutput = `
      Example mermaid output:
            \`\`\`mermaid
            gantt
                title Project Timeline
                dateFormat YYYY-MM-DD
                section Phase 1
                Task 1: t1, 2025-01-01, 10d
                Task 2: t2, after t1, 5d
                Milestone 1: m1, milestone, after t1
                section Phase 2
                Task 3: t3, after m1, 7d
            \`\`\`
      
            Important:
            - SPECIAL CHARACTERS - Do not use any of the reserverd characters as part of task or milestone names or ids. commas, colons, semicolons, etc
            - CUSTOM RULE: Tasks are always defined as <taskname>: <id>, <startdate|"after <taskid>"|"after <milestoneid>">, <duration|enddate>
            - CUSTOM RULE: Always specify an explicit start date OR an "after <taskid>" OR an "after <milestoneid>". NOT BOTH
            - CUSTOM RULE: Start dates are ALWAYS defined as <date> or "after <taskid>" or "after <milestoneid>" - there are no other options. ie "Task 1: t1, 2025-01-01, 10d" or "Task 2: t2, after t1, 5d" or "Task 3: t3, after m1, 7d"
            - DO NOT write it in any other way
                  - e.g. "Developed Design Theme: edt, 2024-06-30, milestone" is not a valid milestone, use "Developed Design Theme: m1, milestone, after t1" instead
                  - e.g. "Developed Design Theme: edt, 2024-06-30, task" is not a valid task, use "Developed Design Theme: t1, 2024-06-30, 10d" instead
            - Sections are always defined as "section <sectionname>"
            - Use indentation for readability
            - Group related tasks in sections
            - Include dependencies with "after" syntax where appropriate
            - If exact dates aren't specified, make reasonable estimates based on context
            `;
      
      
            
      

      export const exampleMermaidOutputNoCodeBlock = `
            Example mermaid output:
                  gantt
                      title Project Timeline
                      dateFormat YYYY-MM-DD
                      section Phase 1
                      Task 1: t1, 2025-01-01, 10d
                      Task 2: t2, after t1, 5d
                      Milestone 1: m1, milestone, after t1
                      section Phase 2
                      Task 3: t3, after m1, 7d
                  Important:
                  - SPECIAL CHARACTERS - Do not use any of the reserverd characters as part of task or milestone names or ids. commas, colons, semicolons, etc
                  - CUSTOM RULE: Tasks are always defined as <taskname>: <id>, <startdate|"after <taskid>"|"after <milestoneid>">, <duration|enddate>
                  - CUSTOM RULE: Always specify an explicit start date OR an "after <taskid>" OR an "after <milestoneid>". NOT BOTH
                  - CUSTOM RULE: Start dates are ALWAYS defined as <date> or "after <taskid>" or "after <milestoneid>" - there are no other options. ie "Task 1: t1, 2025-01-01, 10d" or "Task 2: t2, after t1, 5d" or "Task 3: t3, after m1, 7d"
                  - DO NOT write it in any other way
                        - e.g. "Developed Design Theme: edt, 2024-06-30, milestone" is not a valid milestone, use "Developed Design Theme: m1, milestone, after t1" instead
                        - e.g. "Developed Design Theme: edt, 2024-06-30, task" is not a valid task, use "Developed Design Theme: t1, 2024-06-30, 10d" instead
                  - Sections are always defined as "section <sectionname>"
                  - Use indentation for readability
                  - Group related tasks in sections
                  - Include dependencies with "after" syntax where appropriate
                  - If exact dates aren't specified, make reasonable estimates based on context
                  `;
            
            
                  
            
                  
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
# Deseini Architecture Diagram

This document provides an overview of the architecture diagram created for the Deseini project.

## Overview

The architecture diagram visualizes the complete system architecture of the Deseini application, showing the relationships between frontend components, backend services, database, and external APIs. The diagram follows a clean, black and white aesthetic that matches the project's design philosophy.

## Diagram Components

The diagram is organized into several key sections:

1. **Main Components** - Shows the high-level overview of the system
2. **Frontend Layer** - Details the React application structure
3. **Backend Layer** - Shows the Express server, controllers, and services
4. **Data Layer** - Illustrates the Supabase integration and database tables
5. **API Endpoints** - Lists all available API endpoints
6. **User Flow** - Demonstrates the typical user journey through the system

## Viewing the Diagram

The architecture diagram is created using Mermaid, a markdown-based diagramming tool. You can view it in several ways:

### Option 1: Using VS Code with Mermaid Extension

1. Install the "Markdown Preview Mermaid Support" extension in VS Code
2. Open the `architecture.mmd` file
3. Use the "Markdown: Open Preview" command to view the rendered diagram

### Option 2: Using an Online Mermaid Editor

1. Visit [Mermaid Live Editor](https://mermaid.live/)
2. Copy the contents of the `architecture.mmd` file
3. Paste into the editor to see the rendered diagram

### Option 3: Using GitHub

If you push this file to GitHub, it will automatically render the Mermaid diagram in the repository.

## Modifying the Diagram

To modify the diagram:

1. Edit the `architecture.mmd` file
2. Follow the Mermaid flowchart syntax
3. The diagram uses custom styling for a clean black and white appearance

## Architecture Details

The diagram illustrates the following key architectural decisions:

- **Clean separation** between frontend, backend, and data layers
- **Component-based structure** in the frontend 
- **Service-oriented approach** in the backend
- **Integration with external services** like OpenAI API and Supabase
- **Clear API endpoint organization**
- **User flow visualization** showing typical application usage patterns

The architecture follows modern best practices including:
- Separation of concerns
- Clean interfaces between layers
- Scalable component structure
- Well-defined data flow

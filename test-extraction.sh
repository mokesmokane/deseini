#!/bin/bash
curl -X POST http://localhost:3001/api/extract-role-info \
  -H "Content-Type: application/json" \
  -d '{"text":"Senior Software Engineer role in London, UK. Full-time position starting April 2025. Salary £85,000 per annum. Required skills: TypeScript, React, Node.js. Must have 5+ years of experience in web development. The candidate will be responsible for designing and implementing new features, mentoring junior developers, and ensuring code quality across the platform."}'

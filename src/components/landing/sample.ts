import { v4 as uuidv4 } from "uuid";
import { Message } from './types'

export const sampleIdeas = [
    "What would you build if you had the world's best Designers at your fingertips???",
    "A mobile app for personalized workout routines with AI coaching",
    "An e-commerce website with immersive 3D product previews",
    "A dashboard for tracking carbon footprint with gamification elements",
    "A social platform for collaborative design challenges",
    "A financial app with intuitive data visualization",
    "A productivity tool that combines task management and note-taking",
    "A travel planner with augmented reality location previews"
  ];

  export const sampleMessages: Message[] =[
  {
    id: uuidv4(),
    content: "Hello! I'm your AI assistant. I can help you with various tasks including code examples, data analysis, and general questions. How can I assist you today?",
    timestamp: new Date(),
    role: 'assistant',
    status: 'delivered'
  },
  {
    id: uuidv4(),
    content: "Here are some examples of different content types I can handle:",
    timestamp: new Date(),
    role: 'assistant',
    status: 'delivered',
    sections: [
      {
        type: "code",
        language: "typescript",
        content: `// Example React Component
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}`
      },
      {
        type: "image",
        content: "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1600"
      },
      {
        type: "link",
        content: "https://react.dev"
      }
    ]
  },
  {
    id: uuidv4(),
    content: "Here's a custom React hook for handling form validation:",
    timestamp: new Date(),
    role: 'assistant',
    status: 'delivered',
    sections: [
      {
        type: "code",
        language: "typescript",
        content: `interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

function useFormValidation<T extends Record<string, any>>(
  initialState: T,
  validationRules: Record<keyof T, ValidationRules>
) {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = (name: keyof T, value: any) => {
    const rules = validationRules[name];
    if (!rules) return "";

    if (rules.required && !value) {
      return "This field is required";
    }

    if (rules.minLength && value.length < rules.minLength) {
      return \`Minimum length is \${rules.minLength} characters\`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return \`Maximum length is \${rules.maxLength} characters\`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return "Invalid format";
    }

    return "";
  };

  const handleChange = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const error = validate(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  return { values, errors, handleChange };
}`
      }
    ]
  }
];
    
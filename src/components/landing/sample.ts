import { v4 as uuidv4 } from "uuid";
import { Message } from './types'


export const sampleIdeas = [
  // Digital Projects (25)
  "A mobile app for personalized workout routines with AI coaching",
  "An e-commerce website with immersive 3D product previews",
  "A dashboard for tracking carbon footprint with gamification elements",
  "A social platform for collaborative design challenges",
  "A financial app with intuitive data visualization",
  "A productivity tool that combines task management and mindfulness practices",
  "A digital wardrobe management system using AI style suggestions",
  "A travel planner with augmented reality location previews",
  "A smart home dashboard integrating diverse IoT devices seamlessly",
  "An AI-based interior design app using real-time rendering",
  "A virtual reality museum experience from around the world",
  "An educational app visualizing historical timelines interactively",
  "An interactive storytelling platform for personalized content journeys",
  "A digital marketplace for ethically sourced artisan crafts",
  "A blockchain-based system for verifying authenticity of physical products",
  "A language learning app using adaptive conversational AI",
  "A 3D digital garden for mental health and stress management",
  "An app for crowdsourced urban improvement proposals",
  "A digital platform for real-time collaboration in filmmaking",
  "An interactive cooking app guiding users through gourmet recipes",
  "A virtual concert and event platform with customizable immersive experiences",
  "An AI-driven personal finance coach for financial literacy",
  "An app for community-driven urban farming management",
  "An online service designing personalized furniture via parametric modeling",
  "A platform for immersive digital art galleries",

  // Non-Digital Projects (75)
  "A modular micro-housing solution adaptable to urban spaces",
  "A floating eco-city designed to withstand rising sea levels",
  "A self-sustaining community hub powered by renewable energy",
  "A rewilded urban park designed around biodiversity",
  "An emergency shelter deployable within hours during disasters",
  "A vertical garden that doubles as an air purification system",
  "A climate-responsive home adapting to extreme conditions",
  "An urban rainwater harvesting system integrated into public spaces",
  "A pedestrian-friendly city optimized for walking and cycling",
  "A disaster-resilient affordable housing solution for developing regions",
  "An ergonomic furniture system designed for maximum adaptability",
  "Smart textiles with temperature regulation for extreme climates",
  "Self-sanitizing reusable personal protective equipment",
  "Modular DIY furniture kits encouraging creativity and customization",
  "Sustainable packaging designs eliminating single-use plastic",
  "Ultra-portable solar-powered lighting for off-grid communities",
  "Autonomous robotic farming equipment enhancing sustainability",
  "Lightweight portable shelters for refugees",
  "Adaptive prosthetics with affordable customization",
  "Innovative water purification solutions for remote areas",
  "A zero-waste fashion collection with biodegradable materials",
  "Adaptive clothing designs for people with disabilities",
  "Wearable health-monitoring devices integrated into everyday apparel",
  "An ethical luxury fashion brand with radical transparency",
  "Transformative garments that adapt to climate conditions",
  "A next-gen electric bicycle optimized for urban commuting",
  "An autonomous EV interior focused on user wellbeing",
  "A modular transit system adaptable to diverse geographic conditions",
  "A solar-powered public transit hub",
  "A personal air-mobility device designed for ease of use",
  "Community-driven public art installations inspiring civic engagement",
  "Pop-up experiential learning spaces that promote creativity",
  "Disaster preparedness kits designed with community feedback",
  "Interactive playgrounds designed around inclusive accessibility",
  "Mental health sanctuaries integrated into busy urban environments",
  "Biodegradable building materials using fungi-based mycelium",
  "Coral reef regeneration structures enhancing marine biodiversity",
  "Community composting infrastructure integrated into urban areas",
  "Sustainable ocean cleanup solutions tackling microplastics",
  "Bee-friendly public gardens designed for pollinator recovery",
  "Adaptive interior spaces transforming according to user emotion",
  "Office designs centered around natural biophilic principles",
  "Flexible classroom spaces supporting diverse learning styles",
  "Hospital interiors designed to enhance patient recovery",
  "Minimalist hospitality spaces designed around mental wellness",
  "Portable mental health pods for workplace relaxation",
  "Disaster-zone medical clinics rapidly deployable by air",
  "Age-friendly residential communities promoting social interaction",
  "Modular mobile clinics addressing global healthcare access",
  "Therapeutic landscapes specifically designed for elderly care",
  "Compact urban vertical farms maximizing limited space",
  "Sustainable food packaging fully compostable within days",
  "Indoor hydroponic gardens suitable for residential use",
  "Community food systems designed to combat food insecurity",
  "Edible landscapes integrated into public parks",
  "Hands-on STEM education kits accessible globally",
  "Mobile libraries designed for remote communities",
  "Educational playgrounds integrating physical activity with learning",
  "Outdoor classrooms for nature-based experiential learning",
  "Recreational equipment designed inclusively for children with disabilities",
  "Museums without walls bringing cultural artifacts to public spaces",
  "Interactive memorials designed for empathy and reflection",
  "Heritage preservation through innovative architectural interventions",
  "Community art projects revitalizing neglected urban spaces",
  "Public installations that celebrate multicultural history and heritage",
  "Rapid-deployment sanitation systems for crisis situations",
  "Durable low-cost housing for refugee camps",
  "Flood-resistant community structures utilizing sustainable materials",
  "Portable disaster communication networks",
  "Solar-powered refrigeration for vaccine delivery in remote locations",
  "Collaborative workspaces that adapt to different professional needs",
  "Workplace furniture promoting healthy posture and productivity",
  "Co-working spaces designed specifically for creatives",
  "Innovation hubs for interdisciplinary collaboration",
  "Transformable home-office furniture to optimize remote working environments"
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
    
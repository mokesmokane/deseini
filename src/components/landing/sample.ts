import { v4 as uuidv4 } from "uuid";
import { Message } from './types'


export const sampleIdeas = [
  // Digital Projects (30)
  "A mobile app that creates daily workout plans tailored to your fitness level, with real-time feedback on exercise form using your phone’s camera",
  "An e-commerce website where you can view and customize products in 3D, rotating them to see every angle before buying",
  "A web dashboard that tracks your carbon footprint from travel and energy use, with fun challenges and rewards for reducing emissions",
  "A social platform where designers team up for 48-hour creative challenges, sharing ideas and voting on the best designs",
  "A budgeting app that visualizes your spending habits and savings goals with clear, interactive charts and weekly savings challenges",
  "A task management app that prompts short meditation breaks after long work sessions to boost focus and reduce stress",
  "A wardrobe app that suggests daily outfits from your existing clothes and connects you to sustainable fashion brands",
  "A travel planning app with augmented reality previews of destinations, showing landmarks and hotels in immersive 360° views",
  "A smart home app that controls lights, thermostats, and locks from one interface, with schedules to save energy",
  "An interior design app that lets you rearrange furniture and test color schemes in a 3D model of your room",
  "A virtual reality platform for exploring digitized museum artifacts from around the world, with narrated guided tours",
  "An educational app with interactive 3D timelines that bring historical events to life with animations and quizzes",
  "A storytelling platform where you choose your own adventure, with branching narratives customized to your choices",
  "A marketplace for ethically sourced artisan crafts, with detailed stories about the makers and their sustainable practices",
  "An app that uses blockchain to verify the authenticity of luxury goods, scanning tags to show their origin and journey",
  "A language learning app with AI that listens to your pronunciation and gives instant feedback to improve your speaking",
  "A 3D digital garden app where tending virtual plants helps you relax, with growth tied to your mindfulness goals",
  "A civic app for proposing urban improvements, with maps to pin ideas like new bike lanes or community gardens",
  "A platform for filmmakers to collaborate on scripts and storyboards in real-time, with video calls and shared editing tools",
  "A cooking app with step-by-step video guides for gourmet recipes, tailored to your skill level and kitchen tools",
  "A virtual concert platform where you customize your avatar and stage for live-streamed music events",
  "An AI-powered financial coach app that analyzes your spending and offers simple tips to save more and build wealth",
  "An urban farming app for managing shared garden plots, with reminders for planting and tips from local farmers",
  "A furniture design service where you tweak 3D models to create custom pieces, sent directly to manufacturers",
  "A digital art gallery platform with immersive VR exhibitions, letting you explore and buy artwork from home",
  "A retro-style tool for creating pixel art games, with easy drag-and-drop features to build and share your creations",
  "A music composition app that generates backing tracks based on your melody, letting you experiment with genres",
  "A stargazing app that overlays constellation names and myths in real-time using your phone’s camera",
  "A recipe-sharing platform that analyzes nutritional info and suggests healthier ingredient swaps for your dishes",
  "A virtual pet app where caring for a digital animal encourages daily mindfulness and boosts your mood",

  // Non-Digital Projects (70)
  "A modular micro-housing unit (200 sq ft) using prefabricated panels, assembled in 48 hours with solar power integration",
  "A floating eco-village prototype for 50 residents, with desalination and hydroponic food production, tested in coastal waters",
  "A community hub with 10kW solar panels and rainwater collection, serving as a co-working and event space for 100 people",
  "An urban park with 50+ native plant species and IoT-monitored beehives to boost local pollinator populations",
  "A flat-pack emergency shelter for 4 people, deployable in 2 hours using recycled plastic panels and a steel frame",
  "A 10-meter vertical garden tower with automated irrigation, filtering 500 cubic meters of air daily in urban settings",
  "A passive house with phase-change materials for temperature regulation, designed for extreme climates (-20°C to 40°C)",
  "A public rainwater harvesting system collecting 10,000 liters, integrated into bus stops with UV purification",
  "A 2-km car-free urban zone with dedicated bike lanes and electric shuttle pods, piloted in a mid-sized city",
  "A low-cost concrete dome home (300 sq ft) for disaster-prone areas, built in 5 days with local labor",
  "A modular desk system with adjustable height and cable management, made from FSC-certified bamboo",
  "A jacket with embedded phase-change materials for temperature regulation, tested for -10°C to 30°C environments",
  "A reusable face mask with UV-C self-sanitizing layers, rechargeable via USB for 100 uses",
  "A DIY furniture kit for a bookshelf using interlocking wooden joints, requiring no tools and customizable via laser-cut patterns",
  "Compostable food packaging made from seaweed-based bioplastic, degrading in 30 days under home composting conditions",
  "A 50W solar-powered LED lantern with a 12-hour battery, distributed to off-grid villages for $10/unit",
  "A robotic tiller with AI navigation for small farms, reducing labor by 50% and powered by a 2kW battery",
  "A 10kg portable tent for refugees, made from recycled PET with a 3-minute setup and UV-resistant coating",
  "A 3D-printed prosthetic arm with modular attachments for tasks, costing under $200 and customizable via open-source designs",
  "A gravity-fed water filter using ceramic membranes, providing 10 liters/day for rural households",
  "A fashion line using 100% mushroom leather, with garments biodegradable in 90 days",
  "A wheelchair-accessible jacket with magnetic closures and adjustable hems, designed with user feedback",
  "A smart wristband monitoring heart rate and oxygen levels, woven into cotton straps for daily wear",
  "A luxury handbag brand with blockchain-tracked supply chains, using vegetable-tanned leather and recycled gold",
  "A poncho with shape-memory fabric adapting to rain or heat, tested for 10,000 cycles",
  "An e-bike with a 50km range and regenerative braking, foldable for urban commuters",
  "An EV cabin with air-purifying plants and circadian lighting, retrofitted for existing van chassis",
  "A modular bus system with interchangeable seating and cargo pods, serving rural and urban routes",
  "A 500W solar-powered transit station with EV charging and real-time bus tracking displays",
  "A personal eVTOL drone with a 10km range, controlled via a smartphone app for recreational use",
  "A 10m interactive mural with touch-sensitive LED panels, crowdsourced by local artists",
  "A pop-up STEM lab in a shipping container, with 3D printers and robotics kits for 20 students",
  "A disaster kit with a 72-hour food supply, solar charger, and first-aid, co-designed with relief agencies",
  "A playground with wheelchair-accessible swings and sensory panels, built for 50+ children",
  "A rooftop meditation deck with soundproof panels and greenery, installed in office buildings",
  "A mycelium-based brick with 50% less carbon footprint than concrete, used for non-load-bearing walls",
  "A 3D-printed coral lattice for reef restoration, deployed in 10-meter plots to support marine life",
  "A curbside compost bin system for 100 households, with IoT sensors for pickup scheduling",
  "A floating microplastic filter for harbors, processing 1,000 liters/hour using solar-powered pumps",
  "A 1-acre urban garden with 20 beehives and drip irrigation, yielding 500kg of produce annually",
  "A mood-responsive living room with LED wall panels and scent diffusers, controlled via a mobile app",
  "An office with living plant walls and skylights, reducing HVAC use by 20% through biophilic design",
  "A classroom with movable partitions and writable walls, supporting 30 students in hybrid learning",
  "A hospital ward with circadian lighting and noise-reducing panels, improving patient sleep by 15%",
  "A minimalist hotel room with foldable furniture and calming soundscapes, optimized for 200 sq ft",
  "A portable 2m relaxation pod with VR meditation and white noise, deployed in 50 workplaces",
  "A 10-bed mobile clinic with solar-powered diagnostics, air-dropped to disaster zones",
  "A 50-unit retirement village with communal gardens and smart home accessibility features",
  "A mobile dental clinic in a converted bus, serving 100 patients/week in rural areas",
  "A sensory garden for dementia patients, with 20+ tactile plants and guided pathways",
  "A 100 sq ft vertical farm module producing 50kg of leafy greens monthly, using LED grow lights",
  "A compostable coffee pod degrading in 14 days, compatible with Nespresso machines",
  "A 10 sq ft hydroponic wall unit for apartments, growing herbs with automated nutrient dosing",
  "A community fridge network with 10 solar-powered units, reducing food waste by 500kg/month",
  "A 1-acre public orchard with 50 fruit trees, integrated into a city park with free harvesting",
  "A $50 STEM kit with Arduino and 10 experiments, distributed to 1,000 schools globally",
  "A solar-powered mobile library van with 500 books, serving 5 remote villages weekly",
  "A playground with climbing walls and math puzzles, engaging 100 kids daily",
  "A 500 sq ft outdoor classroom with modular seating and solar-powered projectors",
  "A tricycle with adaptive controls for children with mobility challenges, priced at $150",
  "A pop-up exhibit of 3D-printed cultural artifacts, displayed in 10 public squares",
  "A digital memorial with QR-coded stories from 50 community members, etched in stone",
  "A restored 19th-century facade with energy-efficient glazing, preserving cultural heritage",
  "A 100 sq m street mural project, painted by 20 local artists to revitalize a commercial area",
  "A public sculpture with 50 engraved stories from immigrant communities, lit by solar LEDs",
  "A portable toilet system for crises, with 50L composting tanks and 1-minute setup",
  "A 400 sq ft refugee shelter using rammed earth, housing 6 people for under $1,000",
  "A bamboo-framed community center with flood-resistant stilts, built for 200 residents",
  "A mesh network with 10 solar-powered nodes, providing Wi-Fi to 500 disaster-zone users",
  "A 50L solar-powered fridge for vaccines, maintaining 2-8°C for 48 hours off-grid",
  "A 500 sq ft co-working space with modular desks and acoustic panels, hosting 20 freelancers",
  "An ergonomic chair with dynamic lumbar support, made from recycled ocean plastic",
  "A 1,000 sq ft artist studio with skylights and movable partitions, leased to 10 creatives",
  "A 2,000 sq ft innovation lab with 3D printers and VR stations, hosting 50 collaborators",
  "A foldable home-office desk with integrated cable trays, fitting 10 sq ft when collapsed"
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
    
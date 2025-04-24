import LogoCarousel from '../LogoCarousel';
import TextInput from './IdeationChat/TextInput';

const LandingPage = () => {
  return (
      <div className="w-full h-full bg-white text-black flex items-start justify-center">
        <main className="flex flex-col items-center w-full max-w-[36rem]">
          <LogoCarousel height="240px" />
          <div className="w-full">
            <TextInput />
          </div>
        </main>
      </div>
  );
}

export default LandingPage;

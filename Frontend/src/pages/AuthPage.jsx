import "../styles/auth.css";
import { SignInButton } from "@clerk/clerk-react";
import { OrbitControls, Float } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Abhi } from "../components/Textured";
import LightRays from "../components/LightRays";
import VariableProximity from "@/components/VariableProximity";
import { useRef } from "react";

const AuthPage = () => {
  const containerRef = useRef(null);

  return (
    <div className="auth-container">
      <LightRays
        className="absolute inset-0 z-0"
        raysOrigin="top-center"
        raysColor="#743AD5"
        raysSpeed={1}
        lightSpread={1.3}
        rayLength={1.75}
        pulsating={false}
        fadeDistance={1.1}
        saturation={1.0}
        followMouse={true}
        mouseInfluence={0.7}
        noiseAmount={0.02}
        distortion={0.04}
      />
      <div className="auth-left">
        <div className="auth-hero">
          <div ref={containerRef} className="brand-container">
            <img src="/hello.png" alt="Slap" className="brand-logo" />

            <div ref={containerRef} className="relative text-4xl">
              <VariableProximity
                label="Fluent Meet"
                className="variable-proximity-demo"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={containerRef}
                radius={100}
                falloff="linear"
              />
            </div>
          </div>

          <h1 className="hero-title !text-3xl">Bridging Silence</h1>

          <p className="hero-subtitle">
            A place where deaf and hearing people connect through sign language
            and video calls. Communicate naturally, express freely, and build
            understanding beyond words.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🎥</span>
              <span>Real-time Video Conversations</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">👐</span>
              <span>Sign language communication</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🌍</span>
              <span>Connect deaf & hearing users together</span>
            </div>
          </div>

          <SignInButton mode="modal">
            <button className="cta-button">
              Get Started
              <span className="button-arrow">→</span>
            </button>
          </SignInButton>
        </div>
      </div>

      <div className="auth-right">
        <Canvas camera={{ position: [4, 3, 12], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <Suspense fallback={null}>
            <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
              {/* <PhoneModel /> */}

              <Abhi />
            </Float>
          </Suspense>
          <OrbitControls enableZoom enablePan enableRotate />
        </Canvas>
        <div className="image-overlay"></div>
      </div>
    </div>
  );
};

export default AuthPage;

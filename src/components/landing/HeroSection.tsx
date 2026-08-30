"use client";

import React, { useEffect, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Cloud, Sliders, Map, ShoppingBag, Menu } from "lucide-react";

export default function HeroSection() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacityFade = useTransform(scrollY, [0, 600], [1, 0]);

  const common = { alt: "Premium SaaS Background", fill: true, priority: true, sizes: "100vw" };
  const { props: mobileProps } = getImageProps({ ...common, src: "/image777.webp", quality: 80 });
  const { props: desktopProps } = getImageProps({ ...common, src: "/image.webp", quality: 90 });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { stiffness: 60, damping: 20 } },
  };

  const cardsVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.6
      }
    }
  };

  const cardEntrance = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { stiffness: 50, damping: 20 } },
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#0A122D]">
      
      {/* Cinematic Background */}
      <motion.div 
        className="absolute inset-0 z-0 scale-[1.02] origin-center pointer-events-none md:motion-safe:translate-y-[var(--y-parallax)]" 
        style={{ "--y-parallax": yParallax } as any}
      >
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileProps.srcSet} />
          <source media="(min-width: 768px)" srcSet={desktopProps.srcSet} />
          <img 
            {...desktopProps}
            className="object-cover object-center brightness-[1.10] contrast-[1.08] absolute inset-0 w-full h-full" 
          />
        </picture>
        
        {/* 1. Subtle Blue Gradient Overlay (10-18%) */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(15,91,255,0.18) 0%, rgba(15,91,255,0.10) 100%)"
          }}
        />
        
        {/* 2. Soft Radial Glow behind heading */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 20% 40%, rgba(255,255,255,0.12) 0%, transparent 50%)"
          }}
        />
        
        {/* 3. Gentle vignette on outer edges only */}
        <div 
          className="absolute inset-0"
          style={{
            boxShadow: "inset 0 0 180px rgba(0,0,0,0.3)"
          }}
        />

        {/* Lighting: Warm orange bloom around clouds & lamp */}
        <div className="absolute bottom-[10%] right-[15%] w-[700px] h-[600px] bg-orange-500/20 rounded-full blur-[140px]" />
        
        {/* Lighting: Soft blue glow in upper sky */}
        <div className="absolute top-0 left-[20%] w-[600px] h-[400px] bg-blue-400/20 rounded-full blur-[120px]" />

        {/* Atmosphere: Stars, Particles, Soft Clouds - HIDDEN ON MOBILE FOR PERFORMANCE */}
        <div className="absolute inset-0 overflow-hidden opacity-80 hidden md:block">
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-[12%] left-[15%] w-1 h-1 bg-white rounded-full blur-[1px]" 
          />
          <motion.div 
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }} 
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
            className="absolute top-[28%] left-[45%] w-[2px] h-[2px] bg-blue-100 rounded-full blur-[1px]" 
          />
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4], y: [0, -15, 0] }} 
            transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 2 }}
            className="absolute top-[20%] left-[80%] w-1.5 h-1.5 bg-[#DFFF3E] rounded-full blur-[2px]" 
          />
          <motion.div 
            animate={{ opacity: [0.2, 0.6, 0.2], x: [0, 40, 0] }} 
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            className="absolute top-[50%] left-[10%] w-[3px] h-[3px] bg-white rounded-full blur-[2px]" 
          />
          
          {/* Subtle slow cloud drift */}
          <motion.div 
            animate={{ x: [0, 50, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
            className="absolute top-[-10%] right-[-10%] w-[1000px] h-[800px] bg-white/5 rounded-full blur-[140px] pointer-events-none"
          />
        </div>
      </motion.div>

      {/* Navigation (Premium Glassmorphism) */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out"
        style={{
          background: scrolled ? "rgba(10,18,45,0.45)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
          padding: scrolled ? "12px 0" : "16px 0",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-5 md:px-12 flex items-center justify-between h-[50px] sm:h-[60px]">
          <Link href="/" className="flex items-center gap-2 group shrink-0 min-w-0">
            <div className="relative w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 shrink-0">
              <Image src="/logo.webp" alt="YourPrinter Logo" fill className="object-contain bg-white" />
            </div>
            <span className="text-white font-extrabold text-[16px] sm:text-2xl tracking-tight leading-none truncate">YourPrinter</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-10 text-white font-medium text-[15px]">
            <Link href="/" className="border-b-2 border-[#DFFF3E] pb-1 font-bold">Home</Link>
            <Link href="/services" className="hover:text-white/80 transition-colors">Services</Link>
            <Link href="/how-it-works" className="hover:text-white/80 transition-colors">How It Works</Link>
            <Link href="/pricing" className="hover:text-white/80 transition-colors">Pricing</Link>
            <Link href="/about" className="hover:text-white/80 transition-colors">About Us</Link>
          </nav>
          
          <div className="flex items-center shrink-0 ml-2 gap-2 sm:gap-3">
            <Link 
              href="/auth/signup?type=student" 
              className="bg-[#DFFF3E] text-[#0A122D] font-bold px-3 py-2 sm:px-6 sm:py-3 rounded-[12px] sm:rounded-[16px] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-1.5 w-[110px] sm:w-[150px] text-[13px] sm:text-[15px] whitespace-nowrap"
              style={{ boxShadow: "0 4px 20px rgba(223,255,62,0.2)" }}
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </Link>
            
            {/* Mobile Hamburger Menu */}
            <button className="md:hidden flex items-center justify-center w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-full bg-white text-[#0A122D] shrink-0 hover:scale-105 transition-transform">
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content (Vertically Centered & Left Aligned) */}
      <motion.div style={{ opacity: opacityFade }} className="relative z-10 flex-1 flex flex-col justify-center max-w-[1400px] mx-auto w-full px-5 md:px-12 pt-[100px] sm:pt-[120px] pb-24 sm:pb-16 min-h-[100svh] md:min-h-[60vh]">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-[800px] flex flex-col w-full" 
        >
          {/* Headline */}
          <motion.h1 
            variants={itemVariants}
            className="font-[900] text-white tracking-[-1px] md:tracking-[-2px] leading-[0.95]"
            style={{ fontSize: "clamp(48px, 15vw, 88px)", wordBreak: "break-word", paddingTop: "max(16px, env(safe-area-inset-top))" }}
          >
            Print <br className="md:hidden" />
            made <br className="md:hidden" />
            simple, <br />
            <span 
              className="text-[#DFFF3E] relative inline-block mt-1 sm:mt-0" 
            >
              <span className="relative z-10">anywhere.</span>
              <span className="hidden md:block absolute inset-0 bg-[#DFFF3E] blur-[30px] opacity-25 z-0 pointer-events-none"></span>
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            variants={itemVariants}
            className="text-[18px] sm:text-[20px] md:text-[24px] max-w-[340px] sm:max-w-[650px] font-medium leading-[1.45] sm:leading-[1.7] mt-5 sm:mt-8"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Upload, customize and print your documents with trusted print shops near you. Experience the future of seamless printing.
          </motion.p>
          
          {/* Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full mt-8 sm:mt-12"
          >
            {/* Primary Button */}
            <Link 
              href="/auth/login?type=student"
              className="group relative w-full sm:w-auto md:max-w-[500px] bg-[#DFFF3E] text-[#0A122D] font-bold px-6 h-[56px] sm:h-[72px] rounded-[16px] sm:rounded-[18px] flex items-center justify-center gap-3 text-[17px] sm:text-[18px] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03]"
              style={{ 
                boxShadow: "0 8px 25px rgba(223,255,62,0.15)",
              }}
            >
              <Cloud className="w-5 h-5 shrink-0" />
              Upload & Print
            </Link>

            {/* Secondary Button */}
            <Link 
              href="/how-it-works"
              className="group relative w-full sm:w-auto md:max-w-[500px] flex items-center justify-center gap-3 text-[17px] sm:text-[18px] font-bold text-white px-6 h-[56px] sm:h-[72px] rounded-[16px] sm:rounded-[18px] transition-all duration-300 overflow-hidden hover:bg-[rgba(10,18,45,0.8)]"
              style={{ 
                background: "rgba(10,18,45,0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              How It Works
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-white shrink-0">
                <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 text-[#0A122D]" fill="currentColor" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Glass Feature Cards (Resting at Bottom) */}
      <div className="relative z-20 w-full px-6 sm:px-12 pb-10 mt-auto">
        <motion.div 
          variants={cardsVariants}
          initial="hidden"
          animate="show"
          className="max-w-[1400px] mx-auto flex overflow-x-auto md:grid md:grid-cols-4 gap-6 pb-4 no-scrollbar"
        >
          {/* Cards Data */}
          {[
            { title: "Upload Document", desc: "Upload your file in seconds.", icon: Cloud },
            { title: "Customize", desc: "Choose options that suit your needs.", icon: Sliders },
            { title: "Choose Location", desc: "Find nearby print shops.", icon: Map },
            { title: "We Print", desc: "High quality prints, always.", icon: ShoppingBag }
          ].map((card, i) => (
            <motion.div 
              key={i}
              variants={cardEntrance}
              className="min-w-[260px] md:min-w-0"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 7,
                  ease: "easeInOut",
                  delay: i * 0.4
                }}
                className="w-full h-full"
              >
                <div 
                  className="group relative w-full h-[140px] md:h-[160px] rounded-[22px] p-5 overflow-hidden transition-all duration-500 cursor-pointer flex flex-col justify-center hover:-translate-y-1 hover:scale-[1.02] hover:bg-[rgba(255,255,255,0.14)]"
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                  }}
                >
                  {/* Glass Reflection */}
                  <div className="absolute inset-0 -translate-x-[150%] skew-x-[-30deg] bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-glass-shine" />
                  
                  {/* Card Content */}
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <card.icon className="w-6 h-6 text-[#DFFF3E]" strokeWidth={2.5} />
                      <h3 className="text-white font-bold text-[17px] leading-tight">{card.title}</h3>
                    </div>
                    <p className="text-white/80 text-[14px] leading-snug">{card.desc}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}

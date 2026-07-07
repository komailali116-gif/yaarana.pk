import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: "Female" | "Male" | "Other" | "avatar" | "document" | "generic";
  src?: string;
  wrapperClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackType = "generic",
  alt,
  className,
  wrapperClassName,
  ...props
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const getFallbackUrl = () => {
    switch (fallbackType) {
      case "Female":
        return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400";
      case "Male":
        return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400";
      case "Other":
        return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400";
      case "avatar":
        return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
      case "document":
        return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400";
      default:
        return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400";
    }
  };

  useEffect(() => {
    if (!src) {
      setResolvedSrc(getFallbackUrl());
      setIsLoading(false);
      return;
    }

    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
      setResolvedSrc(src);
      setIsLoading(false);
      return;
    }

    // Direct public storage URL fallback constructor
    const publicUrl = `https://ayypyoczarvufsmolfqx.supabase.co/storage/v1/object/public/app-files/${src}`;
    setResolvedSrc(publicUrl);
    setIsLoading(false);

    // Asynchronously try to sign the storage path
    let isMounted = true;
    const fetchSignedUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("app-files")
          .createSignedUrl(src, 3600);
        if (isMounted && !error && data?.signedUrl) {
          setResolvedSrc(data.signedUrl);
        }
      } catch (err) {
        console.error("Failed to sign url", src, err);
      }
    };
    fetchSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [src, fallbackType]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    if (props.onLoad) {
      props.onLoad(e);
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn("SafeImage failed to load:", resolvedSrc, "falling back to placeholder.");
    setHasError(true);
    setIsLoading(false);
    
    // Attempt fallback
    const fallback = getFallbackUrl();
    if (resolvedSrc !== fallback) {
      setResolvedSrc(fallback);
    }
    
    if (props.onError) {
      props.onError(e);
    }
  };

  return (
    <div className={`relative overflow-hidden ${wrapperClassName || "w-full h-full"}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#F3F0E9]/30 flex items-center justify-center animate-pulse">
          <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        {...props}
        src={resolvedSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className || ""} transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
};

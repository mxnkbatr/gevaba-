"use client";

import React from "react";
import Link, { LinkProps } from "next/link";
import { useLanguage } from "../contexts/LanguageContext";

interface LocalizedLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const LocalizedLink = ({
  href,
  children,
  prefetch = true,
  ...props
}: LocalizedLinkProps) => {
  const { language: lang } = useLanguage();
  
  const hrefString = typeof href === 'string' ? href : href.pathname || '';
  const isExternal = hrefString.startsWith('http') || hrefString.startsWith('mailto:') || hrefString.startsWith('tel:');
  
  if (isExternal) {
    return <a href={hrefString} className={props.className} style={props.style}>{children}</a>;
  }

  // Ensure leading slash if not root
  const normalizedHref = hrefString.startsWith('/') ? hrefString : `/${hrefString}`;
  let path = normalizedHref === '/' ? `/${lang}` : `/${lang}${normalizedHref}`;
  
  // Ensure trailing slash for Capacitor static export compatibility, but avoid breaking query params
  const [urlPath, queryString] = path.split('?');
  if (urlPath && !urlPath.endsWith('/') && !urlPath.includes('.')) {
    path = `${urlPath}/${queryString ? `?${queryString}` : ''}`;
  }

  return (
    <Link href={path} prefetch={prefetch} {...props}>
      {children}
    </Link>
  );
};

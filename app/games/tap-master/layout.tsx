import { Metadata } from 'next';
import { metadata as gameMetadata } from './metadata';

export const metadata: Metadata = gameMetadata;

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 

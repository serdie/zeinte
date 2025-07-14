
"use client";

import { useState, useEffect } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';

interface AppMetrics {
  totalUsers: number;
  activeLast24h: number; // Placeholder
  proUsers: number; // Placeholder
  totalAnalyses: number; // Placeholder
}

export function useAppMetrics() {
  const { isFirebaseConfigured, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<AppMetrics>({
    totalUsers: 0,
    activeLast24h: 0,
    proUsers: 0,
    totalAnalyses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !isAdmin) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch total users
        const usersCol = collection(db, "users");
        const snapshot = await getCountFromServer(usersCol);
        const totalUsersCount = snapshot.data().count;
        
        // TODO: Implement queries for other metrics when data model supports it
        // For example, proUsers would require a query like:
        // const proUsersQuery = query(usersCol, where("tier", "==", "pro"));
        // const proSnapshot = await getCountFromServer(proUsersQuery);
        // const proUsersCount = proSnapshot.data().count;

        setMetrics({
          totalUsers: totalUsersCount,
          activeLast24h: 0, // Placeholder
          proUsers: 0,     // Placeholder
          totalAnalyses: 0 // Placeholder
        });

      } catch (err) {
        console.error("Error fetching app metrics:", err);
        setError("Failed to fetch app metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [isFirebaseConfigured, isAdmin]);

  return { metrics, loading, error };
}

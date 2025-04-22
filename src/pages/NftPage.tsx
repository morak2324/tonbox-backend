import React, { useState, useEffect } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import {
  Wallet,
  ArrowUpDown,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Clock,
  Search,
  Image,
  Gift,
  Sparkles,
  AlertCircle,
  Lock,
  Check,
} from 'lucide-react';
import axios from 'axios';
import { doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../Firebase';
import { unlockAchievement, Achievement } from '../firebase/achievements';
import { useUser } from '../hooks/useUser';
import type { Transaction, Jetton, NFT } from '../types/ton';
import Lottie from 'lottie-react';
import starAnimation from '../assets/animations/star.json';
import elixirAnimation from '../assets/animations/elixir.json';
import { FullscreenNFT } from '../components/FullscreenNFT';

const PUPPY_PAWS_PRICE = 0.5;
const PUPPY_PAWS_SUPPLY = 10000;
const EARLY_ADOPTER_SUPPLY = 5000;
const OWNER_ADDRESS = 'UQAXXoHQRVRB6cXvgN388lWbyogUvKZI3V4aXAokmEzU38QQ';

export function NftPage() {
  const [selectedNFT, setSelectedNFT] = useState<{
    name: string;
    description: string;
    animation: any;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [claiming, setClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [remainingPuppyPaws, setRemainingPuppyPaws] = useState(PUPPY_PAWS_SUPPLY);
  const [remainingEarlyAdopter, setRemainingEarlyAdopter] = useState(EARLY_ADOPTER_SUPPLY);
  const [showPaymentError, setShowPaymentError] = useState(false);
  const [claimedArtifacts, setClaimedArtifacts] = useState<string[]>([]);

  const tg = window.Telegram.WebApp;
  const userId = tg.initDataUnsafe?.user?.id?.toString();
  const { user, isGuest } = useUser(userId);
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  // Load NFT supply and claimed artifacts on mount
  useEffect(() => {
    const loadNFTData = async () => {
      try {
        setLoading(true);
        const nftStatsRef = doc(db, 'nftStats', 'supply');
        const nftStatsDoc = await getDoc(nftStatsRef);
        
        if (!nftStatsDoc.exists()) {
          // Initialize NFT stats if they don't exist
          await updateDoc(nftStatsRef, {
            remainingEarlyAdopter: EARLY_ADOPTER_SUPPLY,
            remainingPuppyPaws: PUPPY_PAWS_SUPPLY,
            totalClaimed: 0
          });
          
          setRemainingEarlyAdopter(EARLY_ADOPTER_SUPPLY);
          setRemainingPuppyPaws(PUPPY_PAWS_SUPPLY);
        } else {
          const stats = nftStatsDoc.data();
          setRemainingEarlyAdopter(stats.remainingEarlyAdopter);
          setRemainingPuppyPaws(stats.remainingPuppyPaws);
        }

        if (userId) {
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setClaimedArtifacts(userData?.claimedArtifacts || []);
          }
        }
      } catch (err) {
        console.error('Error loading NFT data:', err);
        setError('Failed to load NFT data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadNFTData();
  }, [userId]);

  // NFT Collection Data
  const nftCollections = [
    {
      id: 'early-adopter',
      name: 'Rare Artifact',
      description: 'Exclusive NFT only available for the first 5,000 early adopters of Tonbox. This unique digital artifact represents your early participation in the Tonbox ecosystem.',
      animation: starAnimation,
      price: 0,
      remaining: remainingEarlyAdopter,
      total: EARLY_ADOPTER_SUPPLY,
      requiresEarlyAdopter: true,
      available: true,
    },
    {
      id: 'limited-star',
      name: 'Limited Star Collection',
      description: 'Coming soon: A mesmerizing collection of unique star artifacts. Each piece tells a story of celestial beauty and digital innovation.',
      animation: elixirAnimation,
      price: PUPPY_PAWS_PRICE,
      remaining: remainingPuppyPaws,
      total: PUPPY_PAWS_SUPPLY,
      requiresEarlyAdopter: false,
      available: false,
    },
  ];

  const handleClaim = async (collectionId: string) => {
    try {
      if (!userAddress) {
        await tonConnectUI.connectWallet();
        return;
      }

      if (!userId) {
        setError('User not found');
        return;
      }

      const collection = nftCollections.find((c) => c.id === collectionId);
      if (!collection) return;

      if (!collection.available) {
        setError('This collection is not available yet');
        return;
      }

      if (collection.requiresEarlyAdopter && !user?.isEarlyAdopter) {
        setError('You must be an early adopter to claim this NFT');
        return;
      }

      if (collection.remaining === 0) {
        setError('This collection is sold out');
        return;
      }

      if (claimedArtifacts.includes(collection.id)) {
        setError('You have already claimed this artifact');
        return;
      }

      setClaiming(true);
      setError('');
      setShowPaymentError(false);

      // Use transaction to ensure atomic updates
      await runTransaction(db, async (transaction) => {
        const nftStatsRef = doc(db, 'nftStats', 'supply');
        const nftStatsDoc = await transaction.get(nftStatsRef);
        
        if (!nftStatsDoc.exists()) {
          throw new Error('NFT stats not found');
        }

        const stats = nftStatsDoc.data();
        const remainingKey = collectionId === 'early-adopter' ? 'remainingEarlyAdopter' : 'remainingPuppyPaws';
        
        if (stats[remainingKey] <= 0) {
          throw new Error('Collection is sold out');
        }

        if (collection.price > 0) {
          try {
            const amountInNano = Math.floor(collection.price * 1e9);
            const transaction = {
              validUntil: Math.floor(Date.now() / 1000) + 300,
              messages: [
                {
                  address: OWNER_ADDRESS,
                  amount: amountInNano.toString(),
                },
              ],
            };

            await tonConnectUI.sendTransaction(transaction);
          } catch (err) {
            console.error('Payment failed:', err);
            setShowPaymentError(true);
            throw new Error('Payment failed');
          }
        }

        // Update NFT stats
        transaction.update(nftStatsRef, {
          [remainingKey]: stats[remainingKey] - 1,
          totalClaimed: (stats.totalClaimed || 0) + 1
        });

        // Update user's claimed artifacts
        const userRef = doc(db, 'users', userId);
        transaction.update(userRef, {
          claimedArtifacts: [...claimedArtifacts, collection.id]
        });

        // Update local state
        if (collectionId === 'early-adopter') {
          setRemainingEarlyAdopter(stats.remainingEarlyAdopter - 1);
        } else {
          setRemainingPuppyPaws(stats.remainingPuppyPaws - 1);
        }
      });

      // Update local state
      setClaimedArtifacts(prev => [...prev, collection.id]);
      await unlockAchievement(userId, Achievement.NFT_COLLECTOR);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Claiming error:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim NFT');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0A0A0F] text-white overflow-y-auto pb-24">
      <div className="p-4 max-w-[390px] mx-auto">
        {/* Title Card */}
        <div className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/10 mb-6">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Image className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                  NFT Collections
                </h1>
                <p className="text-sm text-gray-400">Exclusive Tonbox NFTs</p>
              </div>
            </div>
          </div>
        </div>

        {/* NFT Collections */}
        <div className="space-y-6 mb-8">
          {nftCollections.map((collection) => (
            <div
              key={collection.id}
              className={`bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl overflow-hidden border border-purple-500/10 transition-transform duration-300 hover:scale-[1.02] ${
                !collection.available && 'opacity-75'
              }`}
            >
              <div 
                className="h-48 bg-gradient-to-br from-purple-900/40 to-purple-800/20 cursor-pointer relative overflow-hidden group"
                onClick={() => setSelectedNFT({
                  name: collection.name,
                  description: collection.description,
                  animation: collection.animation
                })}
              >
                <Lottie
                  animationData={collection.animation}
                  loop={true}
                  className="w-full h-full transform transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white font-semibold">View Full Screen</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{collection.name}</h3>
                  <div className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-400 text-sm">
                    {collection.remaining}/{collection.total}
                  </div>
                </div>
                <p className="text-gray-400 mb-4">{collection.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-400">
                    Price: {collection.price === 0 ? 'Free' : `${collection.price} TON`}
                  </div>
                  {collection.requiresEarlyAdopter && (
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Sparkles className="w-4 h-4" />
                      Early Adopters Only
                    </div>
                  )}
                  {!collection.available && (
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Lock className="w-4 h-4" />
                      Coming Soon
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleClaim(collection.id)}
                  disabled={
                    claiming || 
                    !collection.available || 
                    (collection.requiresEarlyAdopter && !user?.isEarlyAdopter) ||
                    claimedArtifacts.includes(collection.id)
                  }
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    claiming
                      ? 'bg-purple-500/50 cursor-not-allowed'
                      : !collection.available
                      ? 'bg-gray-500/50 cursor-not-allowed'
                      : collection.requiresEarlyAdopter && !user?.isEarlyAdopter
                      ? 'bg-gray-500/50 cursor-not-allowed'
                      : claimedArtifacts.includes(collection.id)
                      ? 'bg-green-500 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                >
                  {claiming ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Claiming...
                    </div>
                  ) : !userAddress ? (
                    'Connect Wallet'
                  ) : !collection.available ? (
                    'Coming Soon'
                  ) : collection.requiresEarlyAdopter && !user?.isEarlyAdopter ? (
                    'Early Adopters Only'
                  ) : claimedArtifacts.includes(collection.id) ? (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Claimed
                    </div>
                  ) : (
                    'Claim Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Fullscreen NFT View */}
        {selectedNFT && (
          <FullscreenNFT
            name={selectedNFT.name}
            description={selectedNFT.description}
            animation={selectedNFT.animation}
            onClose={() => setSelectedNFT(null)}
          />
        )}

        {/* Payment Error Modal */}
        {showPaymentError && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0A0A0F] rounded-3xl p-6 max-w-md w-full mx-auto border border-red-500/20">
              <div className="text-center mb-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-500">Payment Failed</h3>
                <p className="text-gray-400 mt-2">
                  The payment transaction was not completed. Please try again.
                </p>
              </div>
              <button
                onClick={() => setShowPaymentError(false)}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-green-500 text-white rounded-xl shadow-lg z-50 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            NFT Claimed Successfully!
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/20 text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
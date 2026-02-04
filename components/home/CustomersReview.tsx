'use client'
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { Star, CheckCircle, Plus, Send, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: any;
  verified: boolean;
  userId: string;
}

const CustomerReviews: React.FC = () => {
  const [user] = useAuthState(auth);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Reviews & Check if User already reviewed
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      setReviews(reviewData);

      // Check if current user's ID exists in the reviews list
      if (user) {
        const hasReviewed = reviewData.some(rev => rev.userId === user.uid);
        setUserHasReviewed(hasReviewed);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Add Review (Limit to One)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userHasReviewed) return toast.error("You have already shared your feedback!");
    if (!comment.trim()) return toast.error("Please write a comment");

    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        name: user?.displayName || "Anonymous",
        userId: user?.uid,
        rating,
        comment,
        verified: true,
        date: serverTimestamp(),
      });
      
      toast.success("Review posted!");
      setComment('');
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Error posting review");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete Review
  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.success("Review removed");
    } catch (error) {
      toast.error("Could not delete review");
    }
  };

  return (
    <section className="bg-stone-50 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-stone-900">Community Feedback</h2>
            <p className="text-stone-600">Only one review per customer is allowed.</p>
          </div>

          {user ? (
            !userHasReviewed ? (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
              >
                <Plus size={20} /> Write a Review
              </button>
            ) : (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-bold border border-green-200">
                ✅ You've shared your feedback
              </div>
            )
          ) : (
            <p className="text-stone-500 text-sm italic">Sign in to leave a review</p>
          )}
        </div>

        {/* REVIEW GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col gap-3 relative group">
              
              {/* DELETE BUTTON - Only visible to the owner of the review */}
              {user && user.uid === rev.userId && (
                <button 
                  onClick={() => handleDelete(rev.id)}
                  className="absolute top-4 right-4 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete my review"
                >
                  <Trash2 size={18} />
                </button>
              )}

              <div className="flex justify-between items-start">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < rev.rating ? "fill-amber-400 text-amber-400" : "text-stone-200"} />
                  ))}
                </div>
                {rev.verified && <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10}/> VERIFIED</span>}
              </div>
              <p className="text-stone-700 italic">"{rev.comment}"</p>
              <div className="mt-auto pt-4 border-t border-stone-50">
                <p className="font-bold text-stone-900 text-sm">{rev.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL CODE (Same as before) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 text-stone-400"><X /></button>
              <h3 className="text-xl font-bold mb-4">Post your review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(num => (
                      <button type="button" key={num} onClick={() => setRating(num)} className={rating >= num ? 'text-amber-500' : 'text-stone-200'}>
                        <Star size={28} className={rating >= num ? "fill-current" : ""} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea 
                  className="w-full bg-stone-50 border rounded-xl p-4 outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was your experience with gb_farms?"
                />
                <button disabled={submitting} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl">
                  {submitting ? "Processing..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomerReviews;
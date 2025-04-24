// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
// import { format } from 'date-fns';
// import { Calendar, Users, Clock } from 'lucide-react';
// import { markDiscountsAsUsed, calculateDiscountedPrice } from "@/utils/discountCalculator";

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// export default function CheckoutWrapper() {
//   return (
//     <Elements stripe={stripePromise}>
//       <StripeCheckout />
//     </Elements>
//   );
// }

// function StripeCheckout() {
//   const [reservations, setReservations] = useState([]);
//   const [totalAmount, setTotalAmount] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [processing, setProcessing] = useState(false);
//   const [successMessage, setSuccessMessage] = useState("");
//   const [discounts, setDiscounts] = useState(null);
//   const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
//   const [signupDiscountData, setSignupDiscountData] = useState(null);
//   const [priceDetails, setPriceDetails] = useState({
//     originalPrice: 0,
//     finalPrice: 0,
//     totalDiscount: 0,
//     appliedDiscounts: []
//   });
//   const [userId, setUserId] = useState(null);
//   const [userEmail, setUserEmail] = useState(null);
  
//   const [loyaltyDiscountData, setLoyaltyDiscountData] = useState({
//     currentDiscount: null,
//     completedReservations: 0,
//     nextTier: null
//   });

//   const router = useRouter();
//   const stripe = useStripe();
//   const elements = useElements();

//   const fetchLoyaltyDiscountDetails = async (userId) => {
//     try {
//       const response = await fetch(`/api/loyalty-discount?userId=${userId}`);
//       if (!response.ok) {
//         throw new Error("Failed to fetch loyalty discount");
//       }
//       const data = await response.json();
      
//       setLoyaltyDiscountData({
//         currentDiscount: data.currentDiscount,
//         completedReservations: data.completedReservations,
//         nextTier: data.nextTier
//       });

//       return data;
//     } catch (error) {
//       console.error("Error fetching loyalty discount:", error);
//       return null;
//     }
//   };

//   const fetchUserDiscounts = async (userId) => {
//     try {
//       const response = await fetch(`/api/discounts?userId=${userId}`);
//       if (!response.ok) {
//         throw new Error("Failed to fetch discounts");
//       }
//       const data = await response.json();
//       setDiscounts(data);
      
//       if (data.signupDiscount) {
//         setSignupDiscountData(data.signupDiscount);
//       }
      
//       return data;
//     } catch (error) {
//       console.error("Error fetching discounts:", error);
//       return null;
//     }
//   };

//   useEffect(() => {
//     const storedUserEmail = localStorage.getItem("userEmail");
//     const storedUserId = localStorage.getItem("userId");
    
//     if (!storedUserEmail || !storedUserId) {
//       setError("Please log in to proceed with checkout.");
//       setLoading(false);
//       return;
//     }

//     setUserEmail(storedUserEmail);
//     setUserId(storedUserId);

//     const fetchData = async () => {
//       await fetchLoyaltyDiscountDetails(storedUserId);
//       const discountData = await fetchUserDiscounts(storedUserId);

//       const storedReservations = localStorage.getItem(`${storedUserEmail}_checkout`);
      
//       if (storedReservations) {
//         const parsedReservations = JSON.parse(storedReservations);
//         setReservations(parsedReservations);
        
//         const originalTotal = parsedReservations.reduce(
//           (acc, curr) => acc + (curr.totalPrice || 0),
//           0
//         );
        
//         setTotalAmount(originalTotal);
        
//         if (discountData) {
//           const priceInfo = calculateDiscountedPrice(originalTotal, discountData);
//           setPriceDetails(priceInfo);

//           if (discountData.signupDiscount && !discountData.signupDiscount.isUsed) {
//             setSignupDiscountData(discountData.signupDiscount);
//           }
//         }
//       }
//       setLoading(false);
//     };

//     fetchData();
//   }, [router]);

//   useEffect(() => {
//     if (discounts) {
//       let newDiscountData = { ...discounts };
      
//       if (!useLoyaltyPoints && newDiscountData.loyaltyDiscount) {
//         newDiscountData.loyaltyDiscount.isUsed = true;
//       } else if (newDiscountData.loyaltyDiscount) {
//         newDiscountData.loyaltyDiscount.isUsed = false;
//       }

//       const newPriceDetails = calculateDiscountedPrice(
//         totalAmount, 
//         newDiscountData
//       );
      
//       setPriceDetails(newPriceDetails);
//     }
//   }, [useLoyaltyPoints, totalAmount, discounts]);

//   const handleLoyaltyPointsToggle = async () => {
//     const newUseLoyaltyPoints = !useLoyaltyPoints;
    
//     try {
//       const response = await fetch('/api/loyalty-discount/toggle', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           userId,
//           useDiscount: !newUseLoyaltyPoints
//         })
//       });

//       if (!response.ok) {
//         throw new Error('Failed to update loyalty discount preference');
//       }

//       setUseLoyaltyPoints(newUseLoyaltyPoints);
//     } catch (error) {
//       console.error('Error toggling loyalty discount:', error);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccessMessage("");
  
//     if (!stripe || !elements) {
//       return;
//     }
  
//     setProcessing(true);
  
//     try {
//       const cardholderName = e.target.cardholderName.value;
//       if (!cardholderName) {
//         setError("Cardholder name is required");
//         setProcessing(false);
//         return;
//       }
  
//       const response = await fetch("/api/create-payment-intent", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           amount: Math.round(priceDetails.finalPrice * 100),
//           currency: "qar", 
//           metadata: {
//             userId: userId,
//             reservationIds: reservations.map(r => r.reservationItems[0].serviceId).join(',')
//           }
//         }),
//       });
  
//       const { clientSecret } = await response.json();
  
//       const result = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: {
//           card: elements.getElement(CardElement),
//           billing_details: {
//             name: cardholderName,
//           },
//         },
//       });
  
//       if (result.error) {
//         setError(result.error.message);
//         setProcessing(false);
//         return;
//       }
  
//       await markDiscountsAsUsed(
//         parseInt(userId), 
//         priceDetails.appliedDiscounts
//       );
  
//       // Flatten reservationItems from all reservations into a single array
//       const allReservationItems = reservations.flatMap(reservation =>
//         reservation.reservationItems.map(item => ({
//           serviceId: parseInt(item.serviceId),
//           price: item.price,
//           startTime: new Date(item.startTime).toISOString(),
//           endTime: item.endTime ? new Date(item.endTime).toISOString() : new Date(item.startTime).toISOString(),
//           quantity: reservation.quantity || 1,
//           specificServiceId: item.specificService ? item.specificService.id : null
//         }))
//       );
  
//       const requestData = {
//         status: "confirmed",
//         userId: parseInt(userId),
//         totalPrice: priceDetails.finalPrice,
//         originalPrice: priceDetails.originalPrice,
//         discountAmount: priceDetails.totalDiscount,
//         paymentDetails: {
//           paymentIntentId: result.paymentIntent.id,
//           last4: result.paymentIntent.payment_method.last4,
//         },
//         reservationItems: allReservationItems,
//         appliedDiscounts: priceDetails.appliedDiscounts
//       };
  
//       const reservationResponse = await fetch("/api/reservations", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(requestData),
//       });
      
//       if (!reservationResponse.ok) {
//         const errorData = await reservationResponse.json();
//         throw new Error(errorData.error || "Failed to process reservation");
//       }
  
//       const storedReservations = JSON.parse(localStorage.getItem(userEmail) || '[]');
      
//       const remainingReservations = storedReservations.filter(storedReservation => 
//         !reservations.some(processedReservation => 
//           processedReservation.reservationItems[0].serviceId === storedReservation.reservationItems[0].serviceId &&
//           processedReservation.reservationItems[0].startTime === storedReservation.reservationItems[0].startTime
//         )
//       );
  
//       if (remainingReservations.length > 0) {
//         localStorage.setItem(userEmail, JSON.stringify(remainingReservations));
//       } else {
//         localStorage.removeItem(userEmail);
//       }
  
//       localStorage.removeItem(`${userEmail}_checkout`);
  
//       setSuccessMessage("Payment successful! Your reservations have been confirmed.");
//       router.push("/reservations");
//     } catch (error) {
//       console.error("Payment processing error:", error);
//       setError(error.message || "Payment processing failed. Please try again.");
//     } finally {
//       setProcessing(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center">
//         <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
//         <p className="text-gray-600 text-lg">Loading your checkout...</p>
//       </div>
//     );
//   }

//   if (!reservations.length) {
//     return (
//       <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-4xl mx-auto text-center">
//           <h1 className="text-3xl font-bold text-gray-900 mb-4">No Items to Checkout</h1>
//           <p className="text-gray-600 mb-8">Your shopping cart is empty.</p>
//           <button
//             className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             Continue Shopping
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const renderSignupDiscountSection = () => {
//     if (!signupDiscountData) return null;

//     return (
//       <div className="mt-4 pt-4 border-t border-gray-200">
//         <div className="flex justify-between items-center">
//           <div>
//             <h3 className="font-semibold text-gray-800">Signup Discount</h3>
//             <p className="text-sm text-gray-500">
//               {signupDiscountData.discountType === 'PERCENTAGE' 
//                 ? `${signupDiscountData.discount}% off your first purchase` 
//                 : `QAR ${signupDiscountData.discount} off your first purchase`}
//             </p>
//           </div>
//           <span className="text-green-600 font-medium">
//             Applied
//           </span>
//         </div>
//       </div>
//     );
//   };

//   const renderLoyaltyDiscountSection = () => {
//     const { currentDiscount, completedReservations, nextTier } = loyaltyDiscountData;
  
//     if (!currentDiscount) {
//       return (
//         <div className="mt-4 pt-4 border-t border-gray-200">
//           <p className="text-sm text-gray-500">
//             Complete more reservations to unlock loyalty discounts!
//           </p>
//           {nextTier && (
//             <p className="text-sm text-gray-500">
//               Next tier at {nextTier.threshold} reservations
//             </p>
//           )}
//         </div>
//       );
//     }
  
//     return (
//       <div className="mt-4 pt-4 border-t border-gray-200">
//         <div className="flex justify-between items-center">
//           <div>
//             <h3 className="font-semibold text-gray-800">Loyalty Discount</h3>
//             <p className="text-sm text-gray-500">
//               Completed Reservations: {completedReservations}
//             </p>
//             <p className="text-sm text-gray-500">
//               Current Discount: {currentDiscount.discountType === 'PERCENTAGE' 
//                 ? `${currentDiscount.discount}%` 
//                 : `QAR ${currentDiscount.discount}`}
//             </p>
//             {nextTier && (
//               <p className="text-sm text-gray-500">
//                 Next tier at {nextTier.threshold} reservations
//               </p>
//             )}
//           </div>
//           <div>
//             <label className="inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={useLoyaltyPoints}
//                 onChange={handleLoyaltyPointsToggle}
//                 className="sr-only peer"
//               />
//               <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//               <span className="ml-3 text-sm font-medium text-gray-900">Use Loyalty Discount</span>
//             </label>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-4xl mx-auto">
//         <div className="space-y-8">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
//             <p className="mt-2 text-gray-600">Complete your reservation payment</p>
//           </div>

//           {!successMessage && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               <div className="space-y-4">
//                 <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
//                 <div className="bg-white shadow rounded-lg p-6 space-y-4">
//                   {reservations.map((reservation, index) => (
//                     <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
//                       <h3 className="text-lg font-semibold text-gray-800 mb-2">{reservation.name}</h3>
//                       {reservation.reservationItems.map((item, itemIndex) => (
//                         <div key={itemIndex} className="mb-4 last:mb-0">
//                           <p className="font-medium text-gray-700">{item.specificService.name}</p>
//                           <div className="space-y-2 mt-1">
//                             <div className="flex items-center text-gray-600">
//                               <Calendar className="w-5 h-5 mr-2" />
//                               <span>
//                                 {format(new Date(item.startTime), 'MMM dd, yyyy')}
//                                 {item.endTime && ` - ${format(new Date(item.endTime), 'MMM dd, yyyy')}`}
//                               </span>
//                             </div>
//                             <div className="flex items-center text-gray-600">
//                               <Users className="w-5 h-5 mr-2" />
//                               <span>Quantity: {reservation.quantity || 1}</span>
//                             </div>
//                             <div className="flex items-center text-gray-600">
//                               <Clock className="w-5 h-5 mr-2" />
//                               <span>Price: QAR {item.price.toFixed(2)}</span>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ))}
                  
//                   <div className="pt-4 border-t border-gray-200">
//                     <div className="flex justify-between text-gray-700">
//                       <span>Subtotal</span>
//                       <span>QAR {priceDetails.originalPrice.toFixed(2)}</span>
//                     </div>
                    
//                     {priceDetails.appliedDiscounts.map((discount, index) => (
//                       <div key={index} className="flex justify-between text-green-600">
//                         <span>{discount.description}</span>
//                         <span>-QAR {discount.amount.toFixed(2)}</span>
//                       </div>
//                     ))}
                    
//                     <div className="flex justify-between font-bold text-lg mt-2 text-gray-900">
//                       <span>Total</span>
//                       <span>QAR {priceDetails.finalPrice.toFixed(2)}</span>
//                     </div>
//                   </div>
//                   {renderSignupDiscountSection()}
//                   {renderLoyaltyDiscountSection()}
//                 </div>
//               </div>

//               <div>
//                 <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
//                 <div className="bg-white shadow rounded-lg p-6">
//                   <form onSubmit={handleSubmit} className="space-y-4">
//                     <div className="space-y-2">
//                       <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">
//                         Cardholder Name
//                       </label>
//                       <input
//                         id="cardholderName"
//                         name="cardholderName"
//                         type="text"
//                         placeholder="John Doe"
//                         required
//                         className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Card Details
//                       </label>
//                       <div className="p-2 border border-gray-300 rounded-lg">
//                         <CardElement 
//                           options={{
//                             style: {
//                               base: {
//                                 fontSize: '16px',
//                                 color: '#424770',
//                                 '::placeholder': {
//                                   color: '#aab7c4',
//                                 },
//                               },
//                               invalid: {
//                                 color: '#9e2146',
//                               },
//                             },
//                           }}
//                         />
//                       </div>
//                     </div>

//                     {error && (
//                       <p className="text-red-500 text-sm">{error}</p>
//                     )}

//                     <button
//                       type="submit"
//                       disabled={processing || !stripe}
//                       className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//                     >
//                       {processing ? "Processing..." : `Pay QAR ${priceDetails.finalPrice.toFixed(2)}`}
//                     </button>
//                   </form>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { format } from 'date-fns';
import { Calendar, Users, Clock } from 'lucide-react';
import { calculateDiscountedPrice } from "@/utils/discountCalculator";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <StripeCheckout />
    </Elements>
  );
}

function StripeCheckout() {
  const [reservations, setReservations] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [discounts, setDiscounts] = useState(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [signupDiscountData, setSignupDiscountData] = useState(null);
  const [priceDetails, setPriceDetails] = useState({
    originalPrice: 0,
    finalPrice: 0,
    totalDiscount: 0,
    appliedDiscounts: []
  });
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  
  const [loyaltyDiscountData, setLoyaltyDiscountData] = useState({
    currentDiscount: null,
    completedReservations: 0,
    nextTier: null
  });

  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const fetchLoyaltyDiscountDetails = async (userId) => {
    try {
      const response = await fetch(`/api/loyalty-discount?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch loyalty discount");
      }
      const data = await response.json();
      
      setLoyaltyDiscountData({
        currentDiscount: data.currentDiscount,
        completedReservations: data.completedReservations,
        nextTier: data.nextTier
      });

      return data;
    } catch (error) {
      console.error("Error fetching loyalty discount:", error);
      return null;
    }
  };

  const fetchUserDiscounts = async (userId) => {
    try {
      const response = await fetch(`/api/discounts?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch discounts");
      }
      const data = await response.json();
      setDiscounts(data);
      
      if (data.signupDiscount && !data.signupDiscount.isUsed) {
        setSignupDiscountData(data.signupDiscount);
      } else {
        setSignupDiscountData(null);
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching discounts:", error);
      return null;
    }
  };

  useEffect(() => {
    const storedUserEmail = localStorage.getItem("userEmail");
    const storedUserId = localStorage.getItem("userId");
    
    if (!storedUserEmail || !storedUserId) {
      setError("Please log in to proceed with checkout.");
      setLoading(false);
      return;
    }

    setUserEmail(storedUserEmail);
    setUserId(storedUserId);

    const fetchData = async () => {
      await fetchLoyaltyDiscountDetails(storedUserId);
      const discountData = await fetchUserDiscounts(storedUserId);

      const storedReservations = localStorage.getItem(`${storedUserEmail}_checkout`);
      
      if (storedReservations) {
        const parsedReservations = JSON.parse(storedReservations);
        setReservations(parsedReservations);
        
        const originalTotal = parsedReservations.reduce(
          (acc, curr) => acc + (curr.totalPrice || 0),
          0
        );
        
        setTotalAmount(originalTotal);
        
        if (discountData) {
          const priceInfo = calculateDiscountedPrice(originalTotal, discountData);
          setPriceDetails(priceInfo);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    if (discounts) {
      let newDiscountData = { ...discounts };
      
      if (!useLoyaltyPoints && newDiscountData.loyaltyDiscount) {
        newDiscountData.loyaltyDiscount.isUsed = true;
      } else if (newDiscountData.loyaltyDiscount) {
        newDiscountData.loyaltyDiscount.isUsed = false;
      }

      const newPriceDetails = calculateDiscountedPrice(
        totalAmount, 
        newDiscountData
      );
      
      setPriceDetails(newPriceDetails);
    }
  }, [useLoyaltyPoints, totalAmount, discounts]);

  const handleLoyaltyPointsToggle = async () => {
    const newUseLoyaltyPoints = !useLoyaltyPoints;
    
    try {
      const response = await fetch('/api/loyalty-discount/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          useDiscount: !newUseLoyaltyPoints
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update loyalty discount preference');
      }

      setUseLoyaltyPoints(newUseLoyaltyPoints);
    } catch (error) {
      console.error('Error toggling loyalty discount:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
  
    if (!stripe || !elements) {
      return;
    }
  
    setProcessing(true);
  
    try {
      const cardholderName = e.target.cardholderName.value;
      if (!cardholderName) {
        setError("Cardholder name is required");
        setProcessing(false);
        return;
      }
  
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(priceDetails.finalPrice * 100),
          currency: "qar", 
          metadata: {
            userId: userId,
            reservationIds: reservations.map(r => r.reservationItems[0].serviceId).join(',')
          }
        }),
      });
  
      const { clientSecret } = await response.json();
  
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: cardholderName,
          },
        },
      });
  
      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
        return;
      }
  
      // Mark discounts as used via API
      const markDiscountsResponse = await fetch("/api/mark-discounts-used", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          appliedDiscounts: priceDetails.appliedDiscounts
        })
      });
  
      if (!markDiscountsResponse.ok) {
        throw new Error("Failed to mark discounts as used");
      }
  
      // Flatten reservationItems from all reservations into a single array
      const allReservationItems = reservations.flatMap(reservation =>
        reservation.reservationItems.map(item => ({
          serviceId: parseInt(item.serviceId),
          price: item.price,
          startTime: new Date(item.startTime).toISOString(),
          endTime: item.endTime ? new Date(item.endTime).toISOString() : new Date(item.startTime).toISOString(),
          quantity: reservation.quantity || 1,
          specificServiceId: item.specificService ? item.specificService.id : null
        }))
      );
  
      const requestData = {
        status: "confirmed",
        userId: parseInt(userId),
        totalPrice: priceDetails.finalPrice,
        originalPrice: priceDetails.originalPrice,
        discountAmount: priceDetails.totalDiscount,
        paymentDetails: {
          paymentIntentId: result.paymentIntent.id,
          last4: result.paymentIntent.payment_method.last4,
        },
        reservationItems: allReservationItems,
        appliedDiscounts: priceDetails.appliedDiscounts
      };
  
      const reservationResponse = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      if (!reservationResponse.ok) {
        const errorData = await reservationResponse.json();
        throw new Error(errorData.error || "Failed to process reservation");
      }
  
      const storedReservations = JSON.parse(localStorage.getItem(userEmail) || '[]');
      
      const remainingReservations = storedReservations.filter(storedReservation => 
        !reservations.some(processedReservation => 
          processedReservation.reservationItems[0].serviceId === storedReservation.reservationItems[0].serviceId &&
          processedReservation.reservationItems[0].startTime === storedReservation.reservationItems[0].startTime
        )
      );
  
      if (remainingReservations.length > 0) {
        localStorage.setItem(userEmail, JSON.stringify(remainingReservations));
      } else {
        localStorage.removeItem(userEmail);
      }
  
      localStorage.removeItem(`${userEmail}_checkout`);
  
      setSuccessMessage("Payment successful! Your reservations have been confirmed.");
      router.push("/reservations");
    } catch (error) {
      console.error("Payment processing error:", error);
      setError(error.message || "Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-600 text-lg">Loading your checkout...</p>
      </div>
    );
  }

  if (!reservations.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Items to Checkout</h1>
          <p className="text-gray-600 mb-8">Your shopping cart is empty.</p>
          <button
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const renderSignupDiscountSection = () => {
    if (!signupDiscountData || signupDiscountData.isUsed) return null;

    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800">Signup Discount</h3>
            <p className="text-sm text-gray-500">
              {signupDiscountData.discountType === 'PERCENTAGE' 
                ? `${signupDiscountData.discount}% off your first purchase` 
                : `QAR ${signupDiscountData.discount} off your first purchase`}
            </p>
          </div>
          <span className="text-green-600 font-medium">
            Applied
          </span>
        </div>
      </div>
    );
  };

  const renderLoyaltyDiscountSection = () => {
    const { currentDiscount, completedReservations, nextTier } = loyaltyDiscountData;
  
    if (!currentDiscount) {
      return (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Complete more reservations to unlock loyalty discounts!
          </p>
          {nextTier && (
            <p className="text-sm text-gray-500">
              Next tier at {nextTier.threshold} reservations
            </p>
          )}
        </div>
      );
    }
  
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800">Loyalty Discount</h3>
            <p className="text-sm text-gray-500">
              Completed Reservations: {completedReservations}
            </p>
            <p className="text-sm text-gray-500">
              Current Discount: {currentDiscount.discountType === 'PERCENTAGE' 
                ? `${currentDiscount.discount}%` 
                : `QAR ${currentDiscount.discount}`}
            </p>
            {nextTier && (
              <p className="text-sm text-gray-500">
                Next tier at {nextTier.threshold} reservations
              </p>
            )}
          </div>
          <div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useLoyaltyPoints}
                onChange={handleLoyaltyPointsToggle}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">Use Loyalty Discount</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="mt-2 text-gray-600">Complete your reservation payment</p>
          </div>

          {!successMessage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                <div className="bg-white shadow rounded-lg p-6 space-y-4">
                  {reservations.map((reservation, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{reservation.name}</h3>
                      {reservation.reservationItems.map((item, itemIndex) => (
                        <div key={itemIndex} className="mb-4 last:mb-0">
                          <p className="font-medium text-gray-700">{item.specificService.name}</p>
                          <div className="space-y-2 mt-1">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-5 h-5 mr-2" />
                              <span>
                                {format(new Date(item.startTime), 'MMM dd, yyyy')}
                                {item.endTime && ` - ${format(new Date(item.endTime), 'MMM dd, yyyy')}`}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Users className="w-5 h-5 mr-2" />
                              <span>Quantity: {reservation.quantity || 1}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-5 h-5 mr-2" />
                              <span>Price: QAR {item.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span>QAR {priceDetails.originalPrice.toFixed(2)}</span>
                    </div>
                    
                    {priceDetails.appliedDiscounts.map((discount, index) => (
                      <div key={index} className="flex justify-between text-green-600">
                        <span>{discount.description}</span>
                        <span>-QAR {discount.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    
                    <div className="flex justify-between font-bold text-lg mt-2 text-gray-900">
                      <span>Total</span>
                      <span>QAR {priceDetails.finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  {renderSignupDiscountSection()}
                  {renderLoyaltyDiscountSection()}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
                <div className="bg-white shadow rounded-lg p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">
                        Cardholder Name
                      </label>
                      <input
                        id="cardholderName"
                        name="cardholderName"
                        type="text"
                        placeholder="John Doe"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Card Details
                      </label>
                      <div className="p-2 border border-gray-300 rounded-lg">
                        <CardElement 
                          options={{
                            style: {
                              base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                  color: '#aab7c4',
                                },
                              },
                              invalid: {
                                color: '#9e2146',
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={processing || !stripe}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {processing ? "Processing..." : `Pay QAR ${priceDetails.finalPrice.toFixed(2)}`}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/PrivateRoute/auth";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Calendar,
  DollarSign,
  MapPin,
  User2,
  Briefcase,
  InboxIcon,
  Clock,
  CheckCircle,
  MessageSquare,
  XCircle,
  BarChart,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import AdminChatMonitoring from "./AdminChatMonitoring";
import ImageSlider from "./ImageSlider";
import GenerateReportButton from "./GenerateReportButton";
import GenerateSellerReportButton from "./GenerateSellerReportButton";
import StatisticsDashboard from "./StatisticsDashboard";

const MainPage = () => {
  const prefixURL = "/service";
  const isLoggedIn = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userID, setUserID] = useState(null);
  const [userType, setUserType] = useState(null);
  const [allServices, setServices] = useState({
    pending: [],
    approved: [],
    rejected: [],
  });
  const [sellerServices, setsellerServices] = useState({
    pending: [],
    approved: [],
    rejected: [],
  });
  const [activeTab, setActiveTab] = useState("services");
  
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserID(localStorage.getItem("userId"));
      setUserType(localStorage.getItem("userRole"));
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !userID || !userType) {
      return; 
    }

    if (userType === "SELLER") {
      const fetchSellerServices = async () => {
        try {
          const response = await fetch(
            `/api/services/seller/?sellerId=${userID}`
          );
          if (!response.ok) throw new Error("Failed to fetch seller services");
          const data = await response.json();
          setsellerServices({
            pending: data.pending,
            approved: data.approved,
            rejected: data.rejected,
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchSellerServices();
    } else if (userType === "ADMIN") {
      const fetchAllServices = async () => {
        try {
          const response = await fetch(`/api/services/admin`);
          if (!response.ok) throw new Error("Failed to fetch all services");
          const data = await response.json();
          setServices({
            pending: data.pending,
            approved: data.approved,
            rejected: data.rejected,
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAllServices();
    }
    else {
      let userId = localStorage.getItem("userId")
      const fetchBuyerReservations = async () => {
        try {
          const response = await fetch(`/api/reservations/reservationItems?ispublic=1&userId=${userId}`, {
            method: "GET",
          });
          if (!response.ok) {
            throw new Error("Failed to fetch reservations");
          }
          const data = await response.json();
          setReservations(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      if(userId){
      fetchBuyerReservations();
      }
    }
   

  }, [isLoggedIn, userID, userType]);

  const handleUpdateReservation = async (e, item) => {
    e.preventDefault();
    let req = {
      startTime: item.startTime,
      endTime: item.endTime,
      isFilled: true,
      isPublic: true,
      newUserId: userID,
    };

    try {
      const response = await fetch(`/api/reservation-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        const updatedItems = reservations.map((t) =>
          t.id === updatedItem.id ? { ...t, isFilled: true } : t
        );
        console.log(updatedItems ,"llllllllllllllllllllllll"); 
        setReservations(updatedItems);
        toast.success(`You've have been added to this reservation`, {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        });
      } else {
        console.error("Failed to edit reservation item");
      }
    } catch (error) {
      console.error("Error editing reservation item:", error);
    }
  };

  if (userType === "SELLER") {
    return (
      <div className="bg-white min-h-screen">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-black">Seller Dashboard</h1>
            {/* <GenerateSellerReportButton/> */}
            <Link
              href="/addService"
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create New Service
            </Link>
          </div>

          <div className="space-y-8">
            {/* Pending Reservations */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-6 w-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-black">
                  Pending Services
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sellerServices.pending.map((service) => (
                  <ServiceCard
                    key={service.id}
                    title={service.name}
                    imageSrc={`/images/${service.type}.jpg`}
                    description={service.description}
                    link={`${prefixURL}Details?serviceID=${service.id}`}
                  />
                ))}
              </div>
            </div>

            {/* Approved Reservations */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-bold text-black">
                  Approved Services
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sellerServices.approved.map((service) => (
                  <ServiceCard
                    key={service.id}
                    title={service.name}
                    imageSrc={`/images/${service.type}.jpg`}
                    description={service.description}
                    link={`${prefixURL}Details?serviceID=${service.id}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-bold text-black">
                  Rejected Services
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sellerServices?.rejected?.map((service) => (
                  <ServiceCard
                    key={service.id}
                    title={service.name}
                    imageSrc={`/images/${service.type}.jpg`}
                    description={service.description}
                    link={`${prefixURL}Details?serviceID=${service.id}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userType === "ADMIN") {
    return (
      <div className="bg-white min-h-screen">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-black">ADMIN Dashboard</h1>
            <GenerateReportButton />
          </div>

          {/* Admin Tabs */}
          <div className="mb-6 border-b">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("services")}
                className={`py-3 px-4 border-b-2 font-medium ${
                  activeTab === "services"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Services</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`py-3 px-4 border-b-2 font-medium ${
                  activeTab === "chat"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Support Chats</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("statistics")}
                className={`py-3 px-4 border-b-2 font-medium ${
                  activeTab === "statistics"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  <span>Statistics</span>
                </div>
              </button>
            </div>
          </div>

          {activeTab === "services" ? (
            <div className="space-y-8">
              {/* Pending Services */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-black">
                    Pending Services
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {allServices?.pending?.map((service) => (
                    <ServiceCard
                      key={service.id}
                      title={service.name}
                      imageSrc={`/images/${service.type}.jpg`}
                      description={service.description}
                      link={`${prefixURL}Details?serviceID=${service.id}`}
                    />
                  ))}
                </div>
              </div>

              {/* Approved Services */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <h2 className="text-xl font-bold text-black">
                    Approved Services
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {allServices?.approved?.map((service) => (
                    <ServiceCard
                      key={service.id}
                      title={service.name}
                      imageSrc={`/images/${service.type}.jpg`}
                      description={service.description}
                      link={`${prefixURL}Details?serviceID=${service.id}`}
                    />
                  ))}
                </div>
              </div>

              {/* Rejected Services */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-6 w-6 text-red-500" />
                  <h2 className="text-xl font-bold text-black">
                    Rejected Services
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {allServices?.rejected?.map((service) => (
                    <ServiceCard
                      key={service.id}
                      title={service.name}
                      imageSrc={`/images/${service.type}.jpg`}
                      description={service.description}
                      link={`${prefixURL}Details?serviceID=${service.id}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "chat" ? (
            <AdminChatMonitoring />
          ) : activeTab === "statistics" ? (
            <StatisticsDashboard />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <ImageSlider />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-black">
          Our Services
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="sticky top-6 h-[calc(100vh-8rem)] overflow-y-auto">
              <h2 className="text-xl font-bold text-black mb-4">
                Request For Company
              </h2>
              <RequestPartner
                requests={reservations}
                userID={userID}
                handleUpdateReservation={handleUpdateReservation}
                type="public"
              />
            </div>
          </div>

          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ServiceCard
                title="Rent a Car"
                imageSrc="/images/car.jpg"
                description="Rent a car for your travels."
                link={`${prefixURL}?serviceType=rent-car`}
              />
              <ServiceCard
                title="Salon Appointment"
                imageSrc="/images/salon.jpg"
                description="Book a relaxing salon appointment."
                link={`${prefixURL}?serviceType=book-salon`}
              />
              <ServiceCard
                title="Gym"
                imageSrc="/images/gym.jpg"
                description="Reserve a Gym facility near you."
                link={`${prefixURL}?serviceType=book-gym`}
              />
              <ServiceCard
                title="Activities"
                imageSrc="/images/activity.jpg"
                description="Explore exciting activities to do."
                link={`${prefixURL}?serviceType=book-activity`}
              />
              <ServiceCard
                title="Restaurant"
                imageSrc="/images/restaurant.jpg"
                description="Find the perfect hotel for your stay with our curated selection of premium accommodations."
                link={`${prefixURL}?serviceType=book-restaurant`}
              />
              {/* <ServiceCard
                title="Flights"
                imageSrc="/images/flight.jpg"
                description="Explore the best flying options around you."
                link={`${prefixURL}?serviceType=book-flight`}
              /> */}
              <ServiceCard
                title="Court"
                imageSrc="/images/playground.jpg"
                description="Book a playground for your kids."
                link={`${prefixURL}?serviceType=book-playground`}
              />
              <ServiceCard
                title="Book a Hotel"
                imageSrc="/images/hotel.jpg"
                description="Find the perfect hotel for your stay with our curated selection of premium accommodations."
                link={`${prefixURL}?serviceType=book-hotel`}
              />
              <ServiceCard
                title="Event Halls"
                imageSrc="/images/hall.jpg"
                description="Discover elegant venues and event halls perfect for your special occasions and celebrations."
                link={`${prefixURL}?serviceType=book-hall`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceCard = ({ title, imageSrc, description, link }) => {
  return (
    <Link
      className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col items-center hover:shadow-xl transition-all duration-300"
      href={link}
    >
      <div className="relative w-full h-56 mb-4">
        <Image
          src={imageSrc}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="rounded-t-lg"
        />
      </div>
      <div className="p-6 text-center space-y-3">
        <h3 className="text-xl font-semibold text-black">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
};

const RequestPartner = ({
  requests,
  userID,
  handleUpdateReservation,
  type,
}) => {


   console.log(requests , userID , handleUpdateReservation , type , "SDAsdajsdajdsajdasj");
   
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  if (!requests?.length) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          No requests found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {type === "pending"
            ? "No pending reservations at this time."
            : type === "approved"
            ? "No approved reservations at this time."
            : "No partner requests are available at this time."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Service Type
              </th>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Location
              </th>
              <th scope="col" className="px-6 py-3">
                Requested User
              </th>
              <th scope="col" className="px-6 py-3">
                Booking Dates
              </th>
              <th scope="col" className="px-6 py-3">
                Total Price
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((request, index) => (
              <tr
                key={index}
                className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {request.service?.type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {request.service?.name}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {request.service?.location}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {request.reservation.user?.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatDate(request.startTime)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">

                    <span className="text-gray-600 dark:text-gray-300">
                    QAR {request.price}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {request.reservation.userId == userID || request.isFilled ? (
                    <span
                      className={`inline-flex justify-center rounded-full px-3 py-1 text-sm font-medium ${
                        request.isFilled
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {request.isFilled ? "Completed" : "Pending"}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleUpdateReservation(e, request)}
                      className="inline-flex w-24 justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Accept
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MainPage;

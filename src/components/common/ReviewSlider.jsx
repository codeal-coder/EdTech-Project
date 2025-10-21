import React, { useEffect, useState } from "react"
import ReactStars from "react-rating-stars-component"
import { Rating } from 'react-simple-star-rating'

import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"
import "../../App.css"
import { FaStar } from "react-icons/fa"
import { Autoplay, FreeMode, Pagination } from "swiper/modules"
import { apiConnector } from "../../services/apiconnector"
import { ratingsEndpoints } from "../../services/apis"

function ReviewSlider() {
  const [reviews, setReviews] = useState([])
  const truncateWords = 20 // increased for bigger cards

  useEffect(() => {
    ;(async () => {
      const { data } = await apiConnector(
        "GET",
        ratingsEndpoints.REVIEWS_DETAILS_API
      )
      if (data?.success) {
        setReviews(data?.data)
      }
    })()
  }, [])

  return (
    <div className="text-white w-full px-4">
      <div className="my-10 max-w-maxContentTab lg:max-w-maxContent mx-auto">
        <Swiper
          spaceBetween={30} // more space between bigger boxes
          loop={true}
          freeMode={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          breakpoints={{
            320: { slidesPerView: 1 },
            640: { slidesPerView: 1.5 },
            1024: { slidesPerView: 2 },
            1280: { slidesPerView: 3 },
          }}
          modules={[FreeMode, Pagination, Autoplay]}
          className="w-full "
        >
          {reviews.map((review, i) => (
            <SwiperSlide key={i}>
              <div className="flex flex-col h-[190px] justify-between gap-4 rounded-xl bg-richblack-800 p-6 text-[15px] text-richblack-25 shadow-lg hover:scale-[1.02] transition-all duration-300 ">
                {/* Top: User info */}
                <div className="flex items-center gap-4">
                  <img
                    src={
                      review?.user?.image
                        ? review?.user?.image
                        : `https://api.dicebear.com/5.x/initials/svg?seed=${review?.user?.firstName} ${review?.user?.lastName}`
                    }
                    alt="user"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <h1 className="font-semibold text-[16px] text-richblack-5">
                      {`${review?.user?.firstName} ${review?.user?.lastName}`}
                    </h1>
                    <h2 className="text-[13px] font-medium text-richblack-400">
                      {review?.course?.courseName}
                    </h2>
                  </div>
                </div>

                {/* Middle: Review text */}
                <p className="font-medium line-clamp-4 leading-relaxed text-richblack-25">
                  {review?.reviews.split(" ").length > truncateWords
                    ? `${review?.reviews
                        .split(" ")
                        .slice(0, truncateWords)
                        .join(" ")} ...`
                    : review?.reviews}
                </p>

                {/* Bottom: Rating */}
                <div className="flex items-center gap-2 mt-auto">
                  <h3 className="font-semibold text-yellow-100 text-[16px]">
                    {review.rating.toFixed(1)}
                  </h3>
                        <Rating
                            readonly               
                            initialValue={review.rating}  
                            size={22}               
                            fillColor="#ffd700"     
                            emptyColor="gray"       
                            allowFraction={false}
                            direction="ltr"     
                            SVGclassName="inline-block"
                            className=""    
                        />

                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default ReviewSlider

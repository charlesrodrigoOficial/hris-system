"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { updateProfile } from "@/lib/actions/user.actions";
import { BankingDetailsCard } from "./cards/banking-details-card";
import { type ProfileUserData } from "./cards/card-shared";
import { EmploymentDetailsCard } from "./cards/employment-details-card";
import { PersonalDetailsCard } from "./cards/personal-details-card";
import { ProfileDetailsCard } from "./cards/profile-details-card";

type ProfileFormProps = {
  user: ProfileUserData;
};

const sectionTitles = [
  "Profile Details",
  "Personal Details",
  "Banking Details",
  "Employment Details",
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Saving..." : "Save Profile Details"}
    </Button>
  );
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [state, action] = useActionState(updateProfile, {
    success: false,
    message: "",
  });
  const [image, setImage] = React.useState(user.image ?? "");
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateActiveIndex = () => {
      setActiveIndex(carouselApi.selectedScrollSnap());
    };

    updateActiveIndex();
    carouselApi.on("select", updateActiveIndex);
    carouselApi.on("reInit", updateActiveIndex);

    return () => {
      carouselApi.off("select", updateActiveIndex);
      carouselApi.off("reInit", updateActiveIndex);
    };
  }, [carouselApi]);

  return (
    <form action={action} className="space-y-6">
      <input
        type="hidden"
        name="name"
        value={`${user.firstName} ${user.lastName}`.trim()}
      />
      <input type="hidden" name="email" value={user.email} />
      <input type="hidden" name="image" value={image} />

      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl border bg-muted/30 p-3">
          <div className="flex flex-wrap gap-2">
            {sectionTitles.map((title, index) => (
              <Button
                key={title}
                type="button"
                size="sm"
                variant={activeIndex === index ? "default" : "outline"}
                onClick={() => carouselApi?.scrollTo(index)}
              >
                {title}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Card {activeIndex + 1} of {sectionTitles.length}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => carouselApi?.scrollPrev()}
                disabled={!carouselApi?.canScrollPrev()}
              >
                <ChevronLeft />
                <span className="sr-only">Previous card</span>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => carouselApi?.scrollNext()}
                disabled={!carouselApi?.canScrollNext()}
              >
                <ChevronRight />
                <span className="sr-only">Next card</span>
              </Button>
            </div>
          </div>
        </div>

        <Carousel
          className="w-full"
          opts={{ align: "start", loop: false }}
          setApi={setCarouselApi}
        >
          <CarouselContent className="items-start">
            <CarouselItem>
              <ProfileDetailsCard
                user={user}
                image={image}
                onImageChange={setImage}
              />
            </CarouselItem>
            <CarouselItem>
              <PersonalDetailsCard user={user} />
            </CarouselItem>

            <CarouselItem>
              <BankingDetailsCard user={user} />
            </CarouselItem>

            <CarouselItem>
              <EmploymentDetailsCard user={user} />
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!!state.message && (
          <p
            className={`text-sm ${state.success ? "text-green-600" : "text-destructive"}`}
          >
            {state.message}
          </p>
        )}
        <SubmitButton />
      </div>
    </form>
  );
}

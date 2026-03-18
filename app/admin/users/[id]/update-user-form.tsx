"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateUser } from "@/lib/actions/user.actions";
import { updateUserSchema } from "@/lib/validators";
import { BankingDetailsCard } from "./cards/banking-details-card";
import {
  type ManagerOption,
  type Option,
  type UpdateUserFormValues,
} from "./cards/card-shared";
import { EmploymentDetailsCard } from "./cards/employment-details-card";
import { PersonalDetailsCard } from "./cards/personal-details-card";
import { ProfileDetailsCard } from "./cards/profile-details-card";

const sectionTitles = [
  "Personal Details",
  "Profile Details",
  "Banking Details",
  "Employment Details",
] as const;

const UpdateUserForm = ({
  user,
  departments,
  managers,
}: {
  user: UpdateUserFormValues & { employeeId?: string | null };
  departments: Option[];
  managers: ManagerOption[];
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = React.useState(0);

  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: user,
  });

  const startDate = useWatch({
    control: form.control,
    name: "startDate",
  });

  const availableManagers = user.employeeId
    ? managers.filter((manager) => manager.id !== user.employeeId)
    : managers;

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

  const onSubmit = async (values: UpdateUserFormValues) => {
    try {
      const res = await updateUser(values);

      if (!res.success) {
        return toast({
          variant: "destructive",
          description: res.message,
        });
      }

      toast({
        description: res.message,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        description: (error as Error).message,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        method="POST"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
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
                <PersonalDetailsCard form={form} />
              </CarouselItem>
              <CarouselItem>
                <ProfileDetailsCard form={form} />
              </CarouselItem>

              <CarouselItem>
                <BankingDetailsCard form={form} />
              </CarouselItem>

              <CarouselItem>
                <EmploymentDetailsCard
                  form={form}
                  departments={departments}
                  managers={availableManagers}
                  startDate={startDate}
                />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="min-w-40"
          >
            {form.formState.isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UpdateUserForm;

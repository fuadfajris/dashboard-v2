"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Check, Eye, Trash } from "lucide-react";

type Template = {
  id: number;
  title: string;
  category: string;
  thumbnail: string | null;
  description: string | null;
  url: string | null;
  features: string[];
};

type EventData = {
  name: string;
  location: string;
  description: string;
  start_date: string;
  end_date: string;
  capacity: number;
  status: boolean;
  template_id?: number | null;
  image_venue?: string | null;
  hero_image?: string | null;
};

export default function EventFormPage() {
  const { user, token } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [maxHeight, setMaxHeight] = useState<string | undefined>();

  const [event, setEvent] = useState<EventData>({
    name: "",
    location: "",
    description: "",
    start_date: "",
    end_date: "",
    capacity: 0,
    status: true,
    template_id: null,
    image_venue: null,
    hero_image: null,
  });

  const [initialEvent, setInitialEvent] = useState<EventData | null>(null);
  const [isChanged, setIsChanged] = useState(false);
  const [loading, setLoading] = useState(true);

  // image files & remove flags
  const [imageVenueFile, setImageVenueFile] = useState<File | null>(null);
  const [imageVenueRemoved, setImageVenueRemoved] = useState(false);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImageRemoved, setHeroImageRemoved] = useState(false);

  // fetch templates + event detail
  useEffect(() => {
    if (!token || !user) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const templateFetch = fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/templates`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const eventFetch = eventId
          ? fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/events/detail?eventId=${eventId}&merchantId=${user?.merchant_id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
          : Promise.resolve(null);

        const [templateRes, eventRes] = await Promise.all([
          templateFetch,
          eventFetch,
        ]);
        const templateData = await templateRes.json();
        setTemplates(templateData.data || []);

        if (eventRes) {
          const eventData = await eventRes.json();
          const formattedEvent: EventData = {
            name: eventData.name || "",
            location: eventData.location || "",
            description: eventData.description || "",
            start_date: formatDateForInput(eventData.start_date),
            end_date: formatDateForInput(eventData.end_date),
            capacity: eventData.capacity || 0,
            status: eventData.status ?? true,
            template_id: eventData.template_id || null,
            image_venue: eventData.image_venue || null,
            hero_image: eventData.hero_image || null,
          };
          setEvent(formattedEvent);
          setInitialEvent(formattedEvent);
          setSelectedTemplate(eventData.template_id || null);
          setActiveTemplate(eventData.template_id || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token, eventId, user?.merchant_id]);

  // check changes for save button
  useEffect(() => {
    if (!initialEvent) {
      setIsChanged(
        !!event.name &&
          !!event.location &&
          !!event.description &&
          !!event.start_date &&
          !!event.end_date &&
          event.capacity > 0 &&
          selectedTemplate !== null
      );
    } else {
      setIsChanged(
        event.name !== initialEvent.name ||
          event.location !== initialEvent.location ||
          event.description !== initialEvent.description ||
          event.start_date !== initialEvent.start_date ||
          event.end_date !== initialEvent.end_date ||
          event.capacity !== initialEvent.capacity ||
          event.status !== initialEvent.status ||
          selectedTemplate !== initialEvent.template_id ||
          imageVenueFile !== null ||
          imageVenueRemoved ||
          heroImageFile !== null ||
          heroImageRemoved
      );
    }
  }, [
    event,
    selectedTemplate,
    initialEvent,
    imageVenueFile,
    imageVenueRemoved,
    heroImageFile,
    heroImageRemoved,
  ]);

  // scrollable template cards
  useEffect(() => {
    if (!containerRef) return;
    const cards =
      containerRef.querySelectorAll<HTMLDivElement>(".template-card");
    if (!cards.length) return;

    const observer = new ResizeObserver(() => {
      const heights: number[] = [];
      cards.forEach((card, i) => {
        if (i < 3) heights.push(card.offsetHeight);
      });
      const tallest = Math.max(...heights, 0);
      setIsScrollable(cards.length > 3);
      setMaxHeight(`${tallest + 16}px`);
    });

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [templates, containerRef]);

  const formatDateForInput = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // template selection
  const handleSelectTemplate = (id: number) => setSelectedTemplate(id);
  const handlePreviewTemplate = (template: Template) =>
    alert(`Preview Template: ${template.title}`);

  // handle image files
  const handleRemoveImageVenue = () => {
    setImageVenueFile(null);
    setImageVenueRemoved(true);
    setEvent({ ...event, image_venue: null });
  };
  const handleRemoveHeroImage = () => {
    setHeroImageFile(null);
    setHeroImageRemoved(true);
    setEvent({ ...event, hero_image: null });
  };
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "venue" | "hero"
  ) => {
    const file = e.target.files?.[0] || null;
    if (type === "venue") {
      setImageVenueFile(file);
      setImageVenueRemoved(false);
      if (file) setEvent({ ...event, image_venue: URL.createObjectURL(file) });
    } else {
      setHeroImageFile(file);
      setHeroImageRemoved(false);
      if (file) setEvent({ ...event, hero_image: URL.createObjectURL(file) });
    }
  };

  // save event
  const handleSave = async () => {
    if (!isChanged) return;

    try {
      let imageVenueUrl: string | null = event.image_venue || null;
      let heroImageUrl: string | null = event.hero_image || null;
      const selectedTemplateObj = templates.find(
        (t) => t.id === selectedTemplate
      );
      const templateUrl = selectedTemplateObj?.url ?? "";

      // ---- IMAGE VENUE ----
      if (selectedTemplate !== initialEvent?.template_id || imageVenueFile) {
        let fileToUpload: File | null = imageVenueFile;
        if (!fileToUpload && initialEvent?.image_venue) {
          const res = await fetch(initialEvent.image_venue);
          const blob = await res.blob();
          fileToUpload = new File([blob], "reupload.jpg", { type: blob.type });
        }

        if (fileToUpload) {
          const uploadForm = new FormData();
          uploadForm.append("file", fileToUpload);
          uploadForm.append("folder", "event");
          uploadForm.append("scope", "event");
          uploadForm.append("template_id", String(selectedTemplate));
          uploadForm.append("template_url", templateUrl);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadForm,
          });
          if (!uploadRes.ok) throw new Error("Image venue upload failed");
          const uploadJson = await uploadRes.json();
          imageVenueUrl = uploadJson.remote ?? uploadJson.url ?? null;
        }
      }

      if (!imageVenueFile && imageVenueRemoved && !imageVenueUrl) {
        imageVenueUrl = null;
      }

      // ---- HERO IMAGE ----
      if (heroImageFile || heroImageRemoved) {
        if (heroImageFile) {
          const uploadForm = new FormData();
          uploadForm.append("file", heroImageFile);
          uploadForm.append("folder", "event");
          uploadForm.append("scope", "event");
          uploadForm.append("template_id", String(selectedTemplate));
          uploadForm.append("template_url", templateUrl);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadForm,
          });
          if (!uploadRes.ok) throw new Error("Hero image upload failed");
          const uploadJson = await uploadRes.json();
          heroImageUrl = uploadJson.remote ?? uploadJson.url ?? null;
        }
      }

      const body = {
        ...event,
        template_id: selectedTemplate,
        merchant_id: user?.merchant_id,
        image_venue: imageVenueUrl,
        hero_image: heroImageUrl,
      };

      const req = {
        content_key: "event",
        content_name: eventId ? "Edit Event" : "Add Event",
        prevValue: eventId ? { ...initialEvent, id: Number(eventId) } : null,
        newValue: eventId ? { ...body, id: Number(eventId) } : body,
        maker: user,
      };

      // SAVE ACTIVITY
      const method = "POST";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(req),
      });

      if (!res.ok) throw new Error("Failed to create activity event");

      alert("Activity event saved successfully!");
      router.push("/admin/event");
    } catch (err) {
      console.error(err);
      alert("Failed to save event. See console.");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  const today = new Date().toISOString().split("T")[0];
  const minEndDate = event.start_date || today;

  return (
    <div className="grid gap-4">
      <h1 className="text-lg font-bold mb-4 text-gray-800 dark:text-white/90">
        {eventId ? "Edit Event" : "Add Event"}
      </h1>

      {/* Form fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-800 dark:text-white/90 pb-2">Event Name</p>
            <input
              type="text"
              placeholder="Event Name"
              className="border p-2 rounded w-full bg-input"
              value={event.name}
              onChange={(e) => setEvent({ ...event, name: e.target.value })}
            />
          </div>

          <div>
            <p className="text-gray-800 dark:text-white/90 pb-2">Location</p>
            <input
              type="text"
              placeholder="Location"
              className="border p-2 rounded w-full bg-input"
              value={event.location}
              onChange={(e) => setEvent({ ...event, location: e.target.value })}
            />
          </div>
        </div>

        <div>
          <p className="text-gray-800 dark:text-white/90 pb-2">Description</p>
          <textarea
            placeholder="Description"
            className="border p-2 rounded w-full h-32 bg-input"
            value={event.description}
            onChange={(e) =>
              setEvent({ ...event, description: e.target.value })
            }
          />
        </div>

        {/* Start - End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-800 dark:text-white/90 pb-2">Start Date</p>
            <input
              type="date"
              min={today}
              value={event.start_date}
              className="border p-2 rounded w-full bg-input"
              onChange={(e) =>
                setEvent({ ...event, start_date: e.target.value })
              }
            />
          </div>

          <div>
            <p className="text-gray-800 dark:text-white/90 pb-2">End Date</p>
            <input
              type="date"
              min={minEndDate}
              value={event.end_date}
              className="border p-2 rounded w-full bg-input"
              onChange={(e) => setEvent({ ...event, end_date: e.target.value })}
            />
          </div>
        </div>

        {/* Capacity and status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-800 dark:text-white/90 pb-2">Capacity</p>
            <input
              type="number"
              placeholder="Capacity"
              className="border p-2 rounded w-full bg-input"
              value={event.capacity}
              onChange={(e) =>
                setEvent({ ...event, capacity: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <p className="text-gray-800 dark:text-white/90 pb-2">Status</p>
            <select
              className="border p-2 rounded w-full bg-input"
              value={event.status ? "true" : "false"}
              onChange={(e) =>
                setEvent({ ...event, status: e.target.value === "true" })
              }
            >
              <option value="true" className="!text-gray-800">
                Active
              </option>
              <option value="false" className="!text-gray-800">
                Inactive
              </option>
            </select>
          </div>
        </div>

        {/* Image venue */}
        <div>
          <p className="text-gray-800 dark:text-white/90 pb-2">Image Vanue</p>
          <div className="items-center gap-4 grid grid-cols-1 md:grid-cols-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "venue")}
              className="w-full border rounded-lg p-2 mb-2 bg-input"
            />
            {event.image_venue && (
              <div className="relative h-32 overflow-hidden">
                <Image
                  src={event.image_venue}
                  alt="Event Image"
                  width={100}
                  height={100}
                  className="object-cover w-auto h-full rounded"
                />
                <button
                  type="button"
                  onClick={handleRemoveImageVenue}
                  className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hero image */}
        <div>
          <p className="text-gray-800 dark:text-white/90 pb-2">Hero Image</p>
          <div className="items-center gap-4 grid grid-cols-1 md:grid-cols-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "hero")}
              className="w-full border rounded-lg p-2 mb-2 bg-input"
            />
            {event.hero_image && (
              <div className="relative h-32 overflow-hidden">
                <Image
                  src={event.hero_image}
                  alt="Hero Image"
                  width={100}
                  height={100}
                  className="object-cover w-auto h-full rounded"
                />
                <button
                  type="button"
                  onClick={handleRemoveHeroImage}
                  className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template selection */}
      <div
        ref={setContainerRef}
        style={{ maxHeight: isScrollable ? maxHeight : undefined }}
        className={isScrollable ? "overflow-y-auto" : ""}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`template-card cursor-pointer transition-all duration-200 hover:shadow-lg bg-white dark:bg-white/[0.03] ${
                selectedTemplate === template.id
                  ? "ring-2 ring-blue-500 border-blue-500"
                  : activeTemplate === template.id
                  ? "ring-2 ring-green-500 border-green-500"
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleSelectTemplate(template.id)}
            >
              <CardHeader className="pb-3 flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {template.title}
                    {activeTemplate === template.id && (
                      <Badge
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {template.category}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewTemplate(template);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={template.thumbnail || "/placeholder.svg"}
                    alt={`${template.title} preview`}
                    width={200}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!isChanged}
          className={`${
            isChanged
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Save Event
        </Button>
      </div>
    </div>
  );
}

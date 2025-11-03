"use client";

import dynamic from "next/dynamic";

export default function AdminDynamicFormPage({
  params,
}: {
  params: { formType: string };
}) {
  const { formType } = params;

  const FormComponent =
    {
      event: dynamic(() => import("@/components/form/EventFormPage")),
      lineup: dynamic(() => import("@/components/form/LineupFormPage")),
    //   merchant: dynamic(() => import("@/components/form/MerchantFormPage")),
    }[formType] || null;

  if (!FormComponent) {
    return (
      <div className="p-6 text-center text-red-500">
        ❌ Form type <b>{formType}</b> not found.
      </div>
    );
  }

  return <FormComponent />;
}

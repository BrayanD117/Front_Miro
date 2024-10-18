"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

const ResponsibleReportPage = () => {
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();

}
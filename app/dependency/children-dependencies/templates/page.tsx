"use client";

import DependencyTree from "@/app/components/DependencyTree"; // Adjust the import path
import { Text, Title } from "@mantine/core";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";


interface Dependency {
  _id: string;
  dep_code: string;
  name: string;
  members: string[];
  responsible: string;
  dep_father: string;
}

interface ChildrenDependency {
  _id: string;
  dep_code: string;
  name: string;
  members: string[];
  responsible: string;
  dep_father: string;
  children: ChildrenDependency[];
}

const Page = () => {
  const { data: session } = useSession();
  const [fatherDependency, setFatherDependency] = useState<Dependency>();
  const [childrenDependencies, setChildrenDependencies] = useState<
    ChildrenDependency[]
  >([]);

  useEffect(() => {
    const fetchFatherDependencyWithHierarchy = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${session?.user?.email}/hierarchy`,
        );

        setFatherDependency(response.data.fatherDependency ?? undefined);
        setChildrenDependencies(response.data.childrenDependencies ?? []);

      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };

    fetchFatherDependencyWithHierarchy();
  }, []);

  return (
    <div style={{ margin: "0px 20px 0px 20px" }}>
      {fatherDependency && (
        <>
          <Title __size="sm" mb={15}> Plantillas hijas de la dependencia {fatherDependency.name}</Title>
          <DependencyTree dependencies={childrenDependencies} />
        </>
      )}
    </div>
  );
};

export default Page;

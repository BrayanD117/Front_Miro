"use client";

import { Center, Container, Pagination, Table } from "@mantine/core";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { usePeriod } from "@/app/context/PeriodContext";


interface Templates {
  _id: string;
  name: String;
}

interface Validator {
  name: string;
  values: any[];
}

interface PublishedTemplate {
  _id: string;
  name: string;
  published_by: any;
  template: Templates;
  period: any;
  producers_dep_code: string[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  loaded_data: any[];
  validators: Validator[];
  deadline: Date;
}

const DependencyTemplatesPage = () => {
  const router = useRouter();
  const params = useParams();
  const { selectedPeriodId } = usePeriod();
  const { id } = params;

  const [templates, setTemplates] = useState<Templates[]>([]);
  const [dependencyName, setDependencyName] = useState<string>("");

  useEffect(() => {
    if (!id || !selectedPeriodId) return;

    const fetchDependencyTemplates = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${id}/templates`,
          {
            params: {
              periodId: selectedPeriodId,
              limit: 10,
            },
          }
        );

        setTemplates(response.data.templates ?? []);
        setDependencyName(response.data.dependencyName);
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };


    fetchDependencyTemplates();
  }, [id, selectedPeriodId]);

  const rows = templates?.map((template) => (
    <Table.Tr key={template._id}>
      <Table.Td>{template.name}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <h2>
        {dependencyName
          ? `Plantillas asignadas a la dependencia ${dependencyName}`
          : "Plantillas"}
      </h2>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Center inline>Plantilla</Center>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Container>
  );
};

export default DependencyTemplatesPage;

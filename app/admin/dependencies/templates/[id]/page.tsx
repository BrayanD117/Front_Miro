"use client";

import { Center, Container, Pagination, Table } from "@mantine/core";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "./AdminDependenciesPage.module.css";


interface Templates {
  _id: string;
  name: String;
}

const DependencyTemplatesPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [templates, setTemplates] = useState<Templates[]>([]);
  const [dependencyName, setDependencyName] = useState<string>("");

  useEffect(() => {
    if (id) {
      const fetchDependencyTemplates = async () => {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${id}/templates`
          );

          setTemplates(response.data.templates);
          setDependencyName(response.data.dependencyName);
        } catch (error) {
          console.error("Error fetching templates:", error);
        }
      };

      fetchDependencyTemplates();
    }
  }, [id]);

  const rows = templates.map((template) => (
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

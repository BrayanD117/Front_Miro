"use client"

import { Container, Divider, Group, Select, Text, Title } from "@mantine/core"
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Period {
  _id: string;
  name: string;
}

const DuplicatePeriodPage = () => {
  const { data: session } = useSession();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/periods/every`, {
        params: {
          email: session?.user?.email,
        },
      });
      setPeriods(response.data);
    } catch (error) {
      console.error("Error fetching periods:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al obtener los periodos",
        color: "red",
      });
    }
  }

  const fetchAvailablePeriods = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/periods/active`)
      setAvailablePeriods(response.data);
    } catch (error) {
      console.error("Error fetching available periods:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al obtener los periodos disponibles",
        color: "red",
      });
    }
  }

  useEffect(() => {
    fetchPeriods();
    fetchAvailablePeriods();
  }, []);

  return (
    <Container size={'lg'}>
      <Title ta='center'>Duplicación de Periodo</Title>
      <Divider m='md'/>
      <Group grow mt={'md'}>
        <Select
          label={<Text fw={700}>Periodo a Duplicar</Text>}
          data={periods.map(period => ({ value: period._id, label: period.name }))}
        />
        <Select
          label={<Text fw={700}>Periodo Objetivo</Text>}
          data={availablePeriods.map(period => ({ value: period._id, label: period.name }))}
        />
      </Group>
    </Container>
  )
}

export default DuplicatePeriodPage
"use client"

import { Accordion, Button, Container, Divider, Group, rem, Select, Text, Title } from "@mantine/core"
import { showNotification } from "@mantine/notifications";
import { IconCopy, IconCopyPlusFilled } from "@tabler/icons-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Period {
  _id: string;
  name: string;
  producer_end_date: Date;
  responsible_end_date: Date;
}

interface Templates {
  _id: string;
  name: string;
}

interface Reports {
  _id: string;
  name: string;
}

interface ProducerReports {
  _id: string;
  name: string;
}

const DuplicatePeriodPage = () => {
  const { data: session } = useSession();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>();
  const [targetPeriod, setTargetPeriod] = useState<string | null>();
  const [showItems, setShowItems] = useState<boolean>(false);

  const [templates, setTemplates] = useState<Templates[]>([]);
  const [reports, setReports] = useState<Reports[]>([]);
  const [producerReports, setProducerReports] = useState<ProducerReports[]>([]);

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

  const fetchOptions = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/periods/feedDuplicate`, {
        params: {
          email: session?.user?.email,
          fromPeriod: selectedPeriod,
          toPeriod: targetPeriod,
        },
      });
      console.log(response.data)
      setTemplates(response.data.templates);
      setReports(response.data.reports);
      setProducerReports(response.data.producerReports)
    } catch (error) {
      console.error("Error fetching options:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al obtener las opciones",
        color: "red",
      });
    }
  }

  useEffect(() => {
    fetchPeriods();
    fetchAvailablePeriods();
  }, []);

  const handleFeedDuplicate = async () => {
    setShowItems(true);
    fetchOptions();
  }

  return (
    <Container size={'lg'}>
      <Title ta='center'>Duplicación de Periodo</Title>
      <Divider m='md'/>
      <Group grow mt={'md'}>
        <Select
          label={<Text fw={700}>Periodo a Duplicar</Text>}
          data={periods.map(period => ({ value: period._id, label: period.name }))}
          onChange={async (value) => {
            setSelectedPeriod(value)
            setTargetPeriod(null)
          }}
          value={selectedPeriod}
        />
        <Select
          label={<Text fw={700}>Periodo Objetivo</Text>}
          data={availablePeriods.map(period => ({ value: period._id, label: period.name }))}
          onChange={(value) => {
            if(selectedPeriod === value) {
              showNotification({
                title: "Error",
                message: "El periodo a duplicar y el periodo objetivo no pueden ser iguales",
                color: "red",
                timeout: 4000
              });
            } else {
              setTargetPeriod(value)
            }
          }}
          value={targetPeriod}
        />
      </Group>
      <Group mt={'md'} justify="center">
        <Button
          w={rem(300)}
          color="orange"
          variant="light"
          leftSection={<IconCopy/>}
          onClick={handleFeedDuplicate}
        >
          Duplicar Periodo
        </Button>
      </Group>
      {
        showItems && (
          <Accordion chevronPosition="right" variant="separated">

          </Accordion>
        )
      }
    </Container>
  )
}

export default DuplicatePeriodPage
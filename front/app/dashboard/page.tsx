"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, Button, Select } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const [opened, setOpened] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notificationShown, setNotificationShown] = useState(false);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (session?.user?.email && !notificationShown) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/users/roles`,
            { params: { email: session.user.email } }
          );
          setAvailableRoles(response.data.roles);
          if (!response.data.activeRole) {
            setOpened(true);
          } else {
            if (userRole !== response.data.activeRole) {
              setUserRole(response.data.activeRole);
              showNotification({
                title: "Bienvenido",
                message: `Tu rol actual es ${response.data.activeRole}`,
                autoClose: 5000,
                color: "teal",
              });
              setNotificationShown(true);
            }
          }
        } catch (error) {
          console.error("Error fetching roles:", error);
        }
      }
    };

    if (status === "authenticated") {
      fetchUserRoles();
    }
  }, [session, status, notificationShown, userRole]);

  const handleRoleSelect = async (role: string) => {
    if (!session?.user?.email) return;

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/updateActiveRole`,
        {
          email: session.user.email,
          activeRole: role,
        }
      );
      console.log("Active role updated:", response.data);
      setUserRole(role);
      setOpened(false);
      showNotification({
        title: "Rol actualizado",
        message: `Tu nuevo rol es ${role}`,
        autoClose: 5000,
        color: "teal",
      });
    } catch (error) {
      console.error("Error updating active role:", error);
      showNotification({
        title: "Error",
        message: "No se pudo actualizar el rol",
        autoClose: 5000,
        color: "red",
      });
    }
  };

  return (
    <>
      <h1>DashboardPage</h1>
      <Modal
        opened={opened}
        onClose={() => {}}
        title="Selecciona un rol"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        <Select
          label="Selecciona uno de tus roles"
          placeholder="Elige un rol"
          data={availableRoles}
          value={selectedRole}
          onChange={(value) => setSelectedRole(value || "")}
        />
        <Button
          mt="md"
          onClick={() => handleRoleSelect(selectedRole)}
          disabled={!selectedRole}
        >
          Guardar
        </Button>
      </Modal>
    </>
  );
};

export default DashboardPage;

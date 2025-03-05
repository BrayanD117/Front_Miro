"use client";
import React from "react";
import { Accordion, Button } from "@mantine/core";
import Link from "next/link";

interface Dependency {
  _id: string;
  dep_code: string;
  name: string;
  members: string[];
  responsible: string;
  dep_father: string;
  children: Dependency[];
}

interface Props {
  dependencies: Dependency;
}

const DependencyTree = ({ dependencies }: Props) => {
  const renderHierarchy = (dependencies: Dependency[]) => {
    return dependencies.map((dependency) => (
      <Accordion.Item key={dependency._id} value={dependency.dep_code}>
        <Accordion.Control>
          <p style={{ fontWeight: "bold" }}> {dependency.name} </p>
        </Accordion.Control>
        <Accordion.Panel>
          <div>
            <strong>Responsible:</strong> {dependency.responsible || "N/A"}
          </div>
          <div>
            <strong>Members:</strong>
            <ul>
              {dependency.members.map((member) => (
                <li key={member}>{member}</li>
              ))}
            </ul>
          </div>

          <Link href={`/dependency/children-dependencies/templates/${dependency._id}`}>
            <Button> Ver plantillas de la dependencia </Button>
          </Link>

          {dependency.children.length > 0 && (
            <Accordion variant="contained">
              {renderHierarchy(dependency.children)}
            </Accordion>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    ));
  };

  return (
    <Accordion variant="contained">{renderHierarchy(dependencies)}</Accordion>
  );
};

export default DependencyTree;

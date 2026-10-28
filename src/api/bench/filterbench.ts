import { Employee } from "../../types/index";

export interface BenchSearchParams {
  name?: string;
  startDate?: string;
  endDate?: string;
  designation?: string;
  firstName?: string;
  lastName?: string;
  availability?: number;
}

export const searchBenchEmployees = async (
  params: BenchSearchParams,
): Promise<Employee[]> => {
return [
    {
      id: "BT001",
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice.j@example.com",
      phone: "+1-555-1111",
      designation: "Software Engineer",
      experience: 3,
      joinedDate: "2023-05-15",
      skills: ["React", "TypeScript"],
      currentProjects: [],
      gender: "Female",
      availability: 100,
      status: "active",
      startDate: "",
      endDate: "",
      createdAt: "2023-05-15T09:00:00Z",
      updatedAt: "2023-12-01T10:00:00Z",
    },
  ];
};

export const searchByStartDate = async (startDate: string) =>
  searchBenchEmployees({ startDate });
export const searchByDesignation = async (designation: string) =>
  searchBenchEmployees({ designation });
export const searchByFirstName = async (firstName: string) =>
  searchBenchEmployees({ firstName });
export const searchByAvailability = async (availability: number) =>
  searchBenchEmployees({ availability });

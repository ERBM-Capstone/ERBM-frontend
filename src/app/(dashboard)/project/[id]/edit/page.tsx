"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuCircleAlert, LuSave } from "react-icons/lu";
import DropdownSelect from "@/components/ui/DropdownSelect";
import { useAuth } from "@/lib/auth/context";
import { fetchAllPages } from "@/lib/project/fetch-all-pages";
import type { Project, ProjectMember } from "@/lib/project/types";

interface ProjectInformation extends Project {
  department?: string | null;
}

interface EditValues {
  name: string;
  pm_user_id: string;
  pc_user_id: string;
  description: string;
}

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken, user } = useAuth();
  const [project, setProject] = useState<ProjectInformation | null>(null);
  const [pmOptions, setPmOptions] = useState<ProjectMember[]>([]);
  const [pcOptions, setPcOptions] = useState<ProjectMember[]>([]);
  const [values, setValues] = useState<EditValues>({ name: "", pm_user_id: "", pc_user_id: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    async function loadProject() {
      try {
        const token = await getToken();
        if (!active) return;
        if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

        const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const result = await response.json().catch(() => {
          throw new Error("ระบบส่งข้อมูลโครงการกลับมาไม่ถูกต้อง");
        });
        if (!response.ok) throw new Error(result.message ?? "โหลดข้อมูลโครงการไม่สำเร็จ");
        if (!result.data?.id) throw new Error("ไม่พบข้อมูลโครงการ");

        const currentProject = result.data as ProjectInformation;
        let accessibleProjects: Project[] = [currentProject];
        try {
          accessibleProjects = await fetchAllPages<Project>("/api/projects", new URLSearchParams(), token, controller.signal);
          if (!accessibleProjects.some((item) => item.id === currentProject.id)) accessibleProjects.push(currentProject);
        } catch {
          // Keep the currently assigned users available if the optional list lookup fails.
        }

        const uniqueMembers = (members: (ProjectMember | null)[]) => Array.from(
          new Map(members.filter((member): member is ProjectMember => Boolean(member)).map((member) => [member.user_id, member])).values(),
        );
        if (active) {
          setProject(currentProject);
          setPmOptions(uniqueMembers(accessibleProjects.map((item) => item.pm)));
          setPcOptions(uniqueMembers(accessibleProjects.map((item) => item.pc)));
          setValues({
            name: currentProject.name,
            pm_user_id: String(currentProject.pm.user_id),
            pc_user_id: currentProject.pc ? String(currentProject.pc.user_id) : "",
            description: currentProject.description ?? "",
          });
        }
      } catch (loadError) {
        if (active) {
          setError(
            controller.signal.aborted
              ? "ใช้เวลาโหลดนานเกินไป กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"
              : loadError instanceof Error ? loadError.message : "โหลดข้อมูลไม่สำเร็จ",
          );
        }
      } finally {
        window.clearTimeout(timeout);
        if (active) setIsLoading(false);
      }
    }

    loadProject();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [getToken, id]);

  const canManageAssignments = Boolean(project && (
    user?.role_code === "ADMIN" || (user?.role_code === "PM" && project.pm.user_id === user.user_id)
  ));
  const isProjectPC = Boolean(project && user?.role_code === "PC" && project.pc?.user_id === user.user_id);
  const canEdit = Boolean(project && project.status === "ACTIVE" && (canManageAssignments || isProjectPC));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !canEdit) return;

    const body: Record<string, unknown> = {
      name: values.name.trim(),
      description: values.description.trim(),
    };
    if (canManageAssignments) {
      body.pm_user_id = Number(values.pm_user_id);
      body.pc_user_id = values.pc_user_id ? Number(values.pc_user_id) : null;
    }
    if (
      body.name === project.name &&
      body.description === (project.description ?? "") &&
      (!canManageAssignments || (
        Number(values.pm_user_id) === project.pm.user_id &&
        (values.pc_user_id ? Number(values.pc_user_id) : null) === (project.pc?.user_id ?? null)
      ))
    ) {
      setError("ยังไม่มีข้อมูลที่เปลี่ยนแปลง");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => {
        throw new Error("ระบบส่งผลการบันทึกกลับมาไม่ถูกต้อง");
      });
      if (!response.ok) throw new Error(result.message ?? "บันทึกข้อมูลโครงการไม่สำเร็จ");
      router.push(`/project/${id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div role="status" className="space-y-4"><div className="h-8 w-64 animate-pulse rounded bg-surface" /><div className="h-72 animate-pulse rounded-xl bg-surface" /></div>;
  }

  if (!project || !canEdit) {
    return (
      <div className="space-y-6">
        <Link href={`/project/${id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 font-semibold text-text-primary hover:text-neutral"><LuArrowLeft size={20} aria-hidden />กลับไปข้อมูลโครงการ</Link>
        <div role="alert" className="notice-error">{error ?? (project?.status === "CLOSED" ? "โครงการปิดแล้ว ไม่สามารถแก้ไขได้" : "คุณไม่มีสิทธิ์แก้ไขโครงการนี้")}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={`/project/${id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-lg font-semibold text-text-primary hover:text-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
        <LuArrowLeft size={22} aria-hidden />Project Information
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-8">แก้ไขข้อมูลโครงการ</h1>
          <p className="mt-1 text-sm text-text-secondary">{project.project_code} · {project.status === "ACTIVE" ? "ใช้งาน" : "ปิด"}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-white p-5 sm:p-8">
        <section className="space-y-5" aria-labelledby="edit-project-information-title">
          <h2 id="edit-project-information-title" className="border-b border-border pb-3 text-xl font-semibold">ข้อมูลโครงการ</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <EditField id="project-code" label="รหัสโปรเจค" english="Project Code">
              <input id="project-code" value={project.project_code} readOnly className="form-input rounded-lg border border-border bg-surface text-text-secondary" />
            </EditField>
            <EditField id="project-name" label="ชื่อโปรเจค" english="Project Name" required>
              <input id="project-name" value={values.name} onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))} maxLength={255} required className="form-input rounded-lg border border-border bg-white" />
            </EditField>
            <EditField id="project-pm" label="ผู้จัดการโปรเจค" english="Project Manager">
              {canManageAssignments ? (
                <DropdownSelect id="project-pm" label="เลือก PM" value={values.pm_user_id} options={pmOptions.map((person) => ({ label: `${person.first_name} ${person.last_name}`, value: String(person.user_id) }))} onChange={(value) => setValues((previous) => ({ ...previous, pm_user_id: value }))} />
              ) : <ReadOnlyValue value={`${project.pm.first_name} ${project.pm.last_name}`} />}
            </EditField>
            <EditField id="project-pc" label="ผู้ประสานงานโปรเจค" english="Project Coordinator">
              {canManageAssignments ? (
                <DropdownSelect id="project-pc" label="เลือก PC" value={values.pc_user_id} options={[{ label: "ไม่ระบุ", value: "" }, ...pcOptions.map((person) => ({ label: `${person.first_name} ${person.last_name}`, value: String(person.user_id) }))]} onChange={(value) => setValues((previous) => ({ ...previous, pc_user_id: value }))} />
              ) : <ReadOnlyValue value={project.pc ? `${project.pc.first_name} ${project.pc.last_name}` : "—"} />}
            </EditField>
            <EditField id="project-department" label="แผนก" english="Department">
              <ReadOnlyValue value={project.department?.trim() || "—"} />
              {!project.department && <p className="text-xs text-text-secondary">ระบบยังไม่มีข้อมูลแผนกสำหรับโครงการนี้</p>}
            </EditField>
            <EditField id="project-description" label="หมายเหตุ" english="Description" className="sm:col-span-2">
              <textarea id="project-description" value={values.description} onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))} rows={4} className="form-input resize-y rounded-lg border border-border bg-white" />
            </EditField>
          </div>
        </section>

        {error && <div role="alert" className="notice-error flex items-center gap-3"><LuCircleAlert size={18} className="shrink-0" aria-hidden /><p>{error}</p></div>}

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
          <Link href={`/project/${id}`} className="btn-secondary">ยกเลิก</Link>
          <button type="submit" disabled={isSaving} className="btn-primary"><LuSave size={16} aria-hidden />{isSaving ? "กำลังบันทึก…" : "บันทึก"}</button>
        </div>
      </form>
    </div>
  );
}

function EditField({ id, label, english, required = false, className = "", children }: {
  id: string;
  label: string;
  english: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <div>
        <label htmlFor={id} className="text-sm font-medium text-text-primary">{label}{required && <span className="ml-1 text-danger-text" aria-hidden>*</span>}</label>
        <p className="text-xs text-text-secondary">{english}</p>
      </div>
      {children}
    </div>
  );
}

function ReadOnlyValue({ value }: { value: string }) {
  return <div className="flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm text-text-secondary">{value}</div>;
}

export type OrgUser = {
  id: string;
  name: string | null;
  fullName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  image: string | null;
  role: string;
  position: string | null;
  orgLevel: string | null;
  managerId: string | null;

  phoneNo?: string | null;
  address?: string | null;
  officeLocation?: string | null;
  country?: string | null;
  employmentType?: string | null;
  isActive?: boolean;
  dateOfBirth?: string | null;
  hireDate?: string | null;
  about?: string | null;
  linkedIn?: string | null;
  hobbies?: string | null;
  superpowers?: string | null;
  mostFascinatingTrip?: string | null;
  dreamTravelDestination?: string | null;

  manager?: {
    id: string;
    fullName: string | null;
    name: string | null;
    email: string;
    position: string | null;
  } | null;

  department: { departmentName: string } | null;
  branch: { branchName: string } | null;

  _count?: {
    directReports: number;
  };
};

export type OrgNode = OrgUser & {
  children: OrgNode[];
};

function getOrgLevelSortValue(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;

  const direct = Number(value);
  if (Number.isFinite(direct)) return direct;

  const digits = value.match(/\d+/)?.[0];
  if (!digits) return Number.POSITIVE_INFINITY;

  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function compareNodes(a: OrgNode, b: OrgNode) {
  const levelA = getOrgLevelSortValue(a.orgLevel);
  const levelB = getOrgLevelSortValue(b.orgLevel);
  if (levelA !== levelB) return levelA - levelB;

  const nameA = (a.fullName || a.name || a.email || "").toLowerCase();
  const nameB = (b.fullName || b.name || b.email || "").toLowerCase();
  return nameA.localeCompare(nameB);
}

function hasManagerCycle(params: {
  userId: string;
  managerId: string | null;
  userById: Map<string, OrgUser>;
}) {
  const { userId, managerId, userById } = params;
  if (!managerId) return false;
  if (managerId === userId) return true;

  const seen = new Set<string>();
  let current: string | null = managerId;

  while (current) {
    if (current === userId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    current = userById.get(current)?.managerId ?? null;
  }

  return false;
}

function sortTree(node: OrgNode) {
  node.children.sort(compareNodes);
  for (const child of node.children) sortTree(child);
}

export function buildOrgTree(users: OrgUser[]): OrgNode[] {
  const map = new Map<string, OrgNode>();
  const roots: OrgNode[] = [];
  const userById = new Map(users.map((user) => [user.id, user]));

  for (const user of users) {
    map.set(user.id, {
      ...user,
      children: [],
    });
  }

  for (const user of users) {
    const node = map.get(user.id)!;

    if (
      user.managerId &&
      map.has(user.managerId) &&
      !hasManagerCycle({ userId: user.id, managerId: user.managerId, userById })
    ) {
      map.get(user.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.sort(compareNodes);
  for (const root of roots) sortTree(root);

  return roots;
}

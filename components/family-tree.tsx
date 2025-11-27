"use client";

import React, { useMemo, useState } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { User, Heart, Baby, Users, Phone, Mail, Calendar, MapPin, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  dateOfBirth?: Date | string | null;
  role?: string;
}

interface FamilyTreeProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    profileImage?: string | null;
    dateOfBirth?: Date | string | null;
    role?: string;
  };
  spouse?: FamilyMember | null;
  parent?: FamilyMember | null;
  children?: FamilyMember[];
}

interface TreeNode {
  id: string;
  name: string;
  title: string;
  email?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  dateOfBirth?: Date | string | null;
  role?: string;
  children?: TreeNode[];
}

function FamilyNode({ node, isSpouse = false, isPlaceholder = false }: { node: TreeNode; isSpouse?: boolean; isPlaceholder?: boolean }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const initials = node.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "ADMIN":
      case "SUPERADMIN":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
      case "PASTOR":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "LEADER":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "MEMBER":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
      case "GUEST":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  const calculateAge = (dateOfBirth?: Date | string | null) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(node.dateOfBirth);

  if (isPlaceholder) {
    return (
      <div className="w-48 p-3 opacity-0 pointer-events-none">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-transparent" />
        </div>
      </div>
    );
  }

  const NodeCard = (
    <Card className={`relative w-64 p-5 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 ${
      isSpouse 
        ? "border-pink-400 dark:border-pink-600 hover:border-pink-500 dark:hover:border-pink-400 bg-gradient-to-br from-pink-50 via-white to-pink-100/30 dark:from-pink-950/30 dark:via-gray-800 dark:to-pink-900/20" 
        : "border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-400 bg-gradient-to-br from-blue-50/50 via-white to-blue-100/20 dark:from-blue-950/20 dark:via-gray-800 dark:to-blue-900/10"
    } hover:scale-105 transform`}>
      {/* Relationship Badge */}
      {isSpouse && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-pink-500 text-white border-2 border-white shadow-lg">
            <Heart className="w-3 h-3 mr-1 fill-white" />
            Spouse
          </Badge>
        </div>
      )}

      <div className="flex flex-col items-center text-center space-y-3">
        {/* Profile Image */}
        {node.profileImage ? (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <img
              src={node.profileImage}
              alt={node.name}
              className="relative w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-xl ring-4 ring-blue-100 dark:ring-blue-900/50"
            />
            {isSpouse && (
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full p-2 shadow-lg border-2 border-white">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>
        ) : (
          <div className="relative group">
            <div className="absolute inset-0 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity bg-gradient-to-br from-blue-400 to-purple-500"></div>
            <div
              className={`relative w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl border-4 border-white dark:border-gray-700 shadow-xl ring-4 ${
                isSpouse 
                  ? "ring-pink-100 dark:ring-pink-900/50" 
                  : "ring-blue-100 dark:ring-blue-900/50"
              } ${getRoleColor(node.role)}`}
            >
              {initials}
            </div>
            {isSpouse && (
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full p-2 shadow-lg border-2 border-white">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>
        )}
        
        {/* Name and Role */}
        <div className="w-full space-y-2">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight">
            {node.name}
          </h3>
          
          {node.role && (
            <Badge 
              variant="outline" 
              className={`text-xs font-semibold px-3 py-1 ${getRoleColor(node.role)} border-2 shadow-sm`}
            >
              {node.role}
            </Badge>
          )}
        </div>
          
        {/* Age Badge */}
        {age !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-full border border-blue-200 dark:border-blue-800">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {age} years old
            </span>
          </div>
        )}

        {/* Contact Summary */}
        <div className="w-full pt-3 border-t-2 border-gray-100 dark:border-gray-700 space-y-2">
          {node.phone && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
              <Phone className="w-3.5 h-3.5 text-green-600" />
              <span className="font-medium truncate">{node.phone}</span>
            </div>
          )}
          {node.email && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-medium truncate max-w-[180px]">{node.email}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Link href={`/dashboard/people/${node.id}`} className="block group">
          {NodeCard}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-96 p-0 overflow-hidden border-2" side="top">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-4">
            {node.profileImage ? (
              <img
                src={node.profileImage}
                alt={node.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl border-4 border-white shadow-lg bg-white/20`}>
                {initials}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-xl mb-1">{node.name}</h3>
              {node.role && (
                <Badge className="bg-white/20 text-white border-white/40 hover:bg-white/30">
                  {node.role}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 bg-white dark:bg-gray-900">
          {(node.email || node.phone || node.dateOfBirth) && (
            <div className="space-y-3">
              {node.email && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{node.email}</p>
                  </div>
                </div>
              )}
              {node.phone && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Phone</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{node.phone}</p>
                  </div>
                </div>
              )}
              {node.dateOfBirth && age !== null && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Age</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {age} years old • {new Date(node.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button asChild size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
            <Link href={`/dashboard/people/${node.id}`}>
              <User className="w-4 h-4 mr-2" />
              View Full Profile
            </Link>
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}export function FamilyTree({ member, spouse, parent, children = [] }: FamilyTreeProps) {
  const [viewMode, setViewMode] = useState<"tree" | "compact">("tree");
  
  const treeData = useMemo<TreeNode | null>(() => {
    // Build root node
    const rootNode: TreeNode = {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      title: member.role || "Member",
      email: member.email,
      phone: member.phone,
      profileImage: member.profileImage,
      dateOfBirth: member.dateOfBirth,
      role: member.role,
      children: [],
    };

    // Build spouse node if exists
    const spouseNode = spouse ? {
      id: spouse.id,
      name: `${spouse.firstName} ${spouse.lastName}`,
      title: spouse.role || "Member",
      email: spouse.email,
      phone: spouse.phone,
      profileImage: spouse.profileImage,
      dateOfBirth: spouse.dateOfBirth,
      role: spouse.role,
    } : null;

    // Build children nodes
    const childrenNodes: TreeNode[] = children.map((child) => ({
      id: child.id,
      name: `${child.firstName} ${child.lastName}`,
      title: child.role || "Member",
      email: child.email,
      phone: child.phone,
      profileImage: child.profileImage,
      dateOfBirth: child.dateOfBirth,
      role: child.role,
    }));

    // Build parent node if exists
    const parentNode = parent ? {
      id: parent.id,
      name: `${parent.firstName} ${parent.lastName}`,
      title: parent.role || "Member",
      email: parent.email,
      phone: parent.phone,
      profileImage: parent.profileImage,
      dateOfBirth: parent.dateOfBirth,
      role: parent.role,
    } : null;

    // Structure: Parent -> (Member + Spouse) -> Children
    if (parentNode) {
      // If there's a parent, create a couple node for member and spouse
      if (spouseNode) {
        const coupleNode: TreeNode = {
          id: `couple-${member.id}`,
          name: `${member.firstName} & ${spouse.firstName}`,
          title: "Couple",
          children: [rootNode, spouseNode],
        };
        
        // Add children to the couple
        if (childrenNodes.length > 0) {
          coupleNode.children = [...coupleNode.children!, ...childrenNodes];
        }

        return {
          ...parentNode,
          children: [coupleNode],
        };
      } else {
        // No spouse, just member under parent
        if (childrenNodes.length > 0) {
          rootNode.children = childrenNodes;
        }
        return {
          ...parentNode,
          children: [rootNode],
        };
      }
    } else {
      // No parent - show member and spouse as root level
      if (spouseNode) {
        const coupleNode: TreeNode = {
          id: `couple-${member.id}`,
          name: `${member.firstName} & ${spouse.firstName}`,
          title: "Family",
          children: [rootNode, spouseNode],
        };
        
        // Add children
        if (childrenNodes.length > 0) {
          coupleNode.children = [...coupleNode.children!, ...childrenNodes];
        }
        
        return coupleNode;
      } else {
        // No spouse, just member
        if (childrenNodes.length > 0) {
          rootNode.children = childrenNodes;
        }
        return rootNode;
      }
    }
  }, [member, spouse, parent, children]);

  if (!treeData) {
    return (
      <div className="w-full p-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">No family members to display</p>
          <p className="text-sm">Add family members to see the family tree</p>
        </div>
      </div>
    );
  }

  const renderTree = (node: TreeNode, isSpouse = false): React.ReactNode => {
    // Check if this is a couple node (has both member and spouse as children)
    const isCoupleNode = node.id?.startsWith('couple-') && node.children && node.children.length >= 2;
    
    if (isCoupleNode && node.children) {
      // Render couple side by side
      const [memberNode, spouseNode, ...childNodes] = node.children;
      const isMemberSpouse = node.children[0]?.id === member.id;
      
      return (
        <React.Fragment key={node.id}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <FamilyNode node={memberNode} isSpouse={false} />
            <div className="flex items-center">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <FamilyNode node={spouseNode} isSpouse={true} />
          </div>
          {childNodes.length > 0 && (
            <div className="flex items-start justify-center gap-2 flex-wrap mt-4">
              {childNodes.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <FamilyNode node={child} />
                </div>
              ))}
            </div>
          )}
        </React.Fragment>
      );
    }

    // Regular tree node
    return (
      <TreeNode key={node.id} label={<FamilyNode node={node} isSpouse={isSpouse} />}>
        {node.children?.map((child, index) => {
          // Check if this child is a spouse (second child in a couple)
          const childIsSpouse = index === 1 && node.children && node.children.length === 2 && 
                                node.children[0]?.id === member.id;
          return (
            <React.Fragment key={child.id}>
              {renderTree(child, childIsSpouse)}
            </React.Fragment>
          );
        })}
      </TreeNode>
    );
  };

  // Check if root is a couple node
  const isRootCouple = treeData.id?.startsWith('couple-') && treeData.children && treeData.children.length >= 2;

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Controls and Legend */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-6">
          {/* Legend */}
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Family Legend:
            </span>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-pink-200 dark:border-pink-800">
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                <Heart className="w-4 h-4 text-pink-600 fill-pink-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Spouse</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Baby className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Children</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Parent</span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Button
              variant={viewMode === "tree" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tree")}
              className={viewMode === "tree" ? "shadow-md" : ""}
            >
              <Users className="w-4 h-4 mr-2" />
              Tree View
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compact")}
              className={viewMode === "compact" ? "shadow-md" : ""}
            >
              <Users className="w-4 h-4 mr-2" />
              Compact
            </Button>
          </div>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="relative overflow-auto p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-950 dark:via-blue-950/10 dark:to-indigo-950/10 rounded-xl border-2 border-gray-200 dark:border-gray-700 min-h-[600px] shadow-inner">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(99 102 241) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        <div className="relative z-10">{viewMode === "compact" ? (
          // Enhanced Compact View
          <div className="flex flex-col items-center space-y-10">
            {/* Parent Section */}
            {parent && (
              <div className="flex flex-col items-center">
                <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-bold bg-purple-100 text-purple-700 border-2 border-purple-300 shadow-sm">
                  <User className="w-4 h-4 mr-2" />
                  Parent
                </Badge>
                <FamilyNode node={{
                  id: parent.id,
                  name: `${parent.firstName} ${parent.lastName}`,
                  title: parent.role || "Member",
                  email: parent.email,
                  phone: parent.phone,
                  profileImage: parent.profileImage,
                  dateOfBirth: parent.dateOfBirth,
                  role: parent.role,
                }} />
                {/* Connection Line */}
                <div className="relative h-12 w-1 mt-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></div>
                </div>
              </div>
            )}

            {/* Member and Spouse Section */}
            <div className="relative">
              <div className="flex items-center gap-8">
                <FamilyNode node={{
                  id: member.id,
                  name: `${member.firstName} ${member.lastName}`,
                  title: member.role || "Member",
                  email: member.email,
                  phone: member.phone,
                  profileImage: member.profileImage,
                  dateOfBirth: member.dateOfBirth,
                  role: member.role,
                }} />
                
                {spouse && (
                  <>
                    {/* Heart Connection */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-pink-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                        <Heart className="relative w-12 h-12 text-pink-500 fill-pink-500 animate-pulse" />
                      </div>
                      <span className="mt-2 text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wide">
                        Married
                      </span>
                    </div>
                    <FamilyNode node={{
                      id: spouse.id,
                      name: `${spouse.firstName} ${spouse.lastName}`,
                      title: spouse.role || "Member",
                      email: spouse.email,
                      phone: spouse.phone,
                      profileImage: spouse.profileImage,
                      dateOfBirth: spouse.dateOfBirth,
                      role: spouse.role,
                    }} isSpouse={true} />
                  </>
                )}
              </div>
            </div>

            {/* Children Section */}
            {children.length > 0 && (
              <div className="flex flex-col items-center space-y-6 w-full max-w-5xl">
                {/* Connection Line */}
                <div className="relative h-12 w-1">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-green-400 rounded-full"></div>
                </div>
                
                <Badge variant="secondary" className="px-4 py-2 text-sm font-bold bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm">
                  <Baby className="w-4 h-4 mr-2" />
                  Children ({children.length})
                </Badge>
                
                <div className="flex gap-6 flex-wrap justify-center">
                  {children.map((child) => (
                    <FamilyNode key={child.id} node={{
                      id: child.id,
                      name: `${child.firstName} ${child.lastName}`,
                      title: child.role || "Member",
                      email: child.email,
                      phone: child.phone,
                      profileImage: child.profileImage,
                      dateOfBirth: child.dateOfBirth,
                      role: child.role,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Enhanced Tree View
          <>
            {isRootCouple && treeData.children ? (
              <div className="flex flex-col items-center">
                {/* Couple Display */}
                <div className="relative flex items-center justify-center gap-8 mb-10">
                  <FamilyNode node={treeData.children[0]} isSpouse={false} />
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-pink-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                      <Heart className="relative w-14 h-14 text-pink-500 fill-pink-500 animate-pulse drop-shadow-lg" />
                    </div>
                    <span className="text-sm font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wide">
                      Married
                    </span>
                  </div>
                  <FamilyNode node={treeData.children[1]} isSpouse={true} />
                </div>
                
                {/* Children Display */}
                {treeData.children.length > 2 && (
                  <div className="mt-6 w-full">
                    <div className="flex items-center justify-center mb-8">
                      <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent w-64"></div>
                      <div className="mx-4 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full border-2 border-blue-300 dark:border-blue-700">
                        <Baby className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent w-64"></div>
                    </div>
                    <div className="flex items-start justify-center gap-6 flex-wrap">
                      {treeData.children.slice(2).map((child) => (
                        <FamilyNode key={child.id} node={child} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Tree
                label={<FamilyNode node={treeData} />}
                lineWidth="4px"
                lineColor="linear-gradient(180deg, #60a5fa 0%, #818cf8 100%)"
                lineBorderRadius="12px"
                nodePadding="40px"
                lineHeight="60px"
              >
                {treeData.children?.map((child) => (
                  <React.Fragment key={child.id}>{renderTree(child)}</React.Fragment>
                ))}
              </Tree>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}


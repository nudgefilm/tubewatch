"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, Video, Image, FileText } from "lucide-react"
import type { ExecutionAction } from "../mock-data"

interface NextTrendActionSectionProps {
  data: ExecutionAction[]
}

export function NextTrendActionSection({ data }: NextTrendActionSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <CardTitle>실행 액션</CardTitle>
        </div>
        <CardDescription>
          바로 실행 가능한 영상 기획 초안
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((action) => (
            <div
              key={action.id}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        action.experimentPriority === 1
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : action.experimentPriority === 2
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }
                    >
                      실험 우선순위 #{action.experimentPriority}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Video className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">제목</p>
                        <p className="font-medium break-words">{action.videoTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Image className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">썸네일 방향</p>
                        <p className="text-sm break-words">{action.thumbnailDirection}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">콘텐츠 플랜</p>
                        <p className="text-sm break-words">{action.contentPlan}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

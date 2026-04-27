"use client"

import { useState } from "react"
import { Copy, Check, ArrowRight, FileText, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AssistContent {
  thumbnailExample: {
    title: string
    before: string
    after: string
    tip: string
  }
  titleTemplate: {
    title: string
    templates: string[]
    examples: string[]
  }
  promptTemplate: {
    title: string
    prompt: string
  }
}

interface ActionPlanAssistProps {
  data: AssistContent
}

export function ActionPlanAssistSection({ data }: ActionPlanAssistProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">실행 보조</h2>
          <p className="text-sm text-muted-foreground">
            선택 사항 - 외부 도구 초안
          </p>
        </div>
        <Badge variant="secondary">보조 영역</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 썸네일 예시 */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {data.thumbnailExample.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="p-2 bg-destructive/10 rounded text-sm">
                <p className="text-xs text-muted-foreground mb-1">Before</p>
                <p className="line-through text-muted-foreground">{data.thumbnailExample.before}</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-2 bg-foreground/8 rounded text-sm">
                <p className="text-xs text-muted-foreground mb-1">After</p>
                <p className="font-medium text-foreground">{data.thumbnailExample.after}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: {data.thumbnailExample.tip}
            </p>
          </CardContent>
        </Card>

        {/* 제목 템플릿 */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {data.titleTemplate.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">템플릿</p>
              {data.titleTemplate.templates.map((template, index) => (
                <div key={index} className="p-2 bg-background rounded text-sm font-mono">
                  {template}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">예시</p>
              {data.titleTemplate.examples.map((example, index) => (
                <div key={index} className="p-2 bg-primary/5 rounded text-sm">
                  {example}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI 프롬프트 */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              {data.promptTemplate.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-background rounded text-sm font-mono leading-relaxed">
              {data.promptTemplate.prompt}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => handleCopy(data.promptTemplate.prompt)}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  프롬프트 복사
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

import { Module } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';
import { AiAdviceService } from './ai-advice.service';

@Module({
  providers: [OpenRouterService, AiAdviceService],
  exports: [AiAdviceService],
})
export class AiModule {}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) { }

  @Post()
  create(@Body() createModuleDto: CreateModuleDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.modulesService.create(userId, createModuleDto);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = req.user.userId;
    return this.modulesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.modulesService.findOne(userId, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.modulesService.update(userId, id, updateModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.modulesService.remove(userId, id);
  }
}

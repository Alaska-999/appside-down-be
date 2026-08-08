import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { parseCursorQuery } from 'src/common/pagination/pagination.util';



@UseGuards(JwtAuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) { }

  @Post()
  create(@Body() createModuleDto: CreateModuleDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.modulesService.create(userId, createModuleDto);
  }

  @Post(':id/save')
  saveToLibrary(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.modulesService.saveToLibrary(userId, id);
  }

  @Get()
  findAll(
    @Query() query: { cursor?: string; limit?: string; search?: string; sort?: string },
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const sort = query.sort === 'az' || query.sort === 'favs' ? query.sort : 'date';
    return this.modulesService.findAll(userId, { ...parseCursorQuery(query), sort });
  }

  @Get('public')
  findPublic(
    @Query() query: { cursor?: string; limit?: string; search?: string; excludeOwn?: string },
    @Req() req: any,
  ) {
    const excludeUserId = query.excludeOwn === 'true' ? req.user.userId : undefined;
    return this.modulesService.findPublic({ ...parseCursorQuery(query), excludeUserId });
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.modulesService.getStats(req.user.userId);
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
